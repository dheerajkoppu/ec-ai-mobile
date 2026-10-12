import { sql } from "@/lib/db";
import { callOpenAIStructured, formatPromptFacts } from "@/lib/openai";
import { getOrSetServerCache, hashServerCacheValue } from "@/lib/serverCache";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

const AI_DESCRIPTION_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const AI_DESCRIPTION_PROMPT_VERSION = "v2";
const AI_DESCRIPTION_SCHEMA = {
  name: "activity_summary",
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
    },
    required: ["summary"],
    additionalProperties: false,
  },
};
const PRIVATE_CACHE_CONTROL =
  "private, max-age=259200, stale-while-revalidate=604800";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { activity_id } = await request.json();
    if (!activity_id) {
      return new Response(JSON.stringify({ error: "Missing params" }), {
        status: 400,
      });
    }

    const [row] = await sql`
      SELECT
        a.name,
        a.roles,
        a.description,
        COALESCE(
          array_remove(array_agg(h.description), NULL),
          ARRAY[]::text[]
        ) AS descriptions
      FROM activities a
      LEFT JOIN hours_logged h ON h.activity_id = a.id
      WHERE a.clerk_id = ${clerkId}
        AND a.id = ${activity_id}
      GROUP BY a.name, a.roles, a.description
    `;

    if (!row) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
      });
    }

    const descriptions = Array.isArray(row.descriptions)
      ? row.descriptions.filter(Boolean)
      : [];
    const fingerprint = hashServerCacheValue({
      name: row.name,
      roles: row.roles,
      description: row.description ?? null,
      descriptions,
    });
    const cacheKey = [
      "ai-description",
      clerkId,
      String(activity_id),
      AI_DESCRIPTION_PROMPT_VERSION,
      fingerprint,
    ].join(":");

    const description = await getOrSetServerCache(
      cacheKey,
      AI_DESCRIPTION_CACHE_TTL_MS,
      async () => {
        const facts = formatPromptFacts({
          "Activity Name": row.name,
          Roles: row.roles,
          "Current Description": row.description,
          "Logged Hours Descriptions": descriptions.join(" ").slice(0, 1500),
        });
        const prompt = `
Act as an elite Ivy League admissions officer. Write an activity summary of at most 150 characters using only the info below. Use strong verbs and precise adjectives. Avoid filler. Focus on leadership, uniqueness, sustained commitment, and tangible results. Include a number only if it appears in the info below. Never invent numbers, awards, results, or any detail that is not given. Only use "I" as a pronoun.

${facts}
`.trim();

        const { summary } = await callOpenAIStructured<{ summary: string }>(
          prompt,
          AI_DESCRIPTION_SCHEMA,
        );

        // An empty summary must fail here, otherwise it would be cached for days
        if (!summary.trim()) {
          throw new Error("OpenAI returned an empty activity summary");
        }

        // Installed app versions read this field as a plain string
        return summary.trim();
      },
    );

    return new Response(JSON.stringify({ description }), {
      status: 200,
      headers: {
        "Cache-Control": PRIVATE_CACHE_CONTROL,
        Vary: "Authorization",
      },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
