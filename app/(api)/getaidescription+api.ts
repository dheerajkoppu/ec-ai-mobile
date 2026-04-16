import { sql } from "@/lib/db";
import { callOpenAI } from "@/lib/openai";
import {
  getOrSetServerCache,
  hashServerCacheValue,
} from "@/lib/serverCache";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

const AI_DESCRIPTION_CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const AI_DESCRIPTION_PROMPT_VERSION = "v1";
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
        const allLoggedDescriptions = descriptions.join(" ").slice(0, 1500);
        const prompt = `
Act as an elite Ivy League admissions officer. Write a 150-character activity summary using the info below. Use numbers to quantify impact, strong verbs, and precise adjectives. Avoid filler. Focus on leadership, uniqueness, sustained commitment, and tangible results. Only use "I" as a pronoun. Do NOT explain anything. Return ONLY the 150-character summary. No intro or closing.

Current Description: ${row.description ?? "N/A"}
Activity Name: ${row.name}
Roles: ${row.roles}
All Logged Hours Descriptions: ${allLoggedDescriptions}
`.trim();

        return callOpenAI(prompt);
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
