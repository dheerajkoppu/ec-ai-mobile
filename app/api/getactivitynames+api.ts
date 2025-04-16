import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: "Missing user email" }, { status: 400 });
    }

    const activities = await sql`
      SELECT
        a.id,
        a.name
      FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE u.email = ${email};
    `;

    return new Response(JSON.stringify({ data: activities }), { status: 200 });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
