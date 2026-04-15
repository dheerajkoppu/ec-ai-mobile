import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function GET(request: Request) {
  try {
    await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    // Fetch activity types sorted alphabetically
    const response = await sql`
      SELECT name FROM activityTypes ORDER BY name ASC;
    `;

    // Format into { label, value } objects with slugified values
    const formatted = response.map((row: any) => ({
      label: row.name,
      value: row.name.toLowerCase().replace(/[^\w]+/g, "-"),
    }));

    return new Response(JSON.stringify({ data: formatted }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching activity types:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
