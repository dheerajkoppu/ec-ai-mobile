import { sql } from "@/lib/db";

export async function GET(request: Request) {
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
