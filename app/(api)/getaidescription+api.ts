import { sql } from "@/lib/db";
import { callOpenAI } from "@/lib/openai";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

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
    const allLoggedDescriptions = descriptions.join(" ").slice(0, 1500);
    const prompt = `
Act as an elite Ivy League admissions officer. Write a 150-character activity summary using the info below. Use numbers to quantify impact, strong verbs, and precise adjectives. Avoid filler. Focus on leadership, uniqueness, sustained commitment, and tangible results. Only use "I" as a pronoun. Do NOT explain anything. Return ONLY the 150-character summary. No intro or closing.

Current Description: ${row.description ?? "N/A"}
Activity Name: ${row.name}
Roles: ${row.roles}
All Logged Hours Descriptions: ${allLoggedDescriptions}
`.trim();

    const description = await callOpenAI(prompt);
    return new Response(JSON.stringify({ description }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
