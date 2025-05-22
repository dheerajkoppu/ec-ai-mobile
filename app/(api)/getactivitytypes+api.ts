// /app/api/activity-types/route.ts
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const response =
      await sql`SELECT name FROM activityTypes ORDER BY name ASC;`;

    // Return in format: [{ label, value }]
    const formatted = response.map((row: any) => ({
      label: row.name,
      value: row.name.toLowerCase().replace(/[^\w]+/g, "-"), // slugify
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
