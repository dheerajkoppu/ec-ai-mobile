import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerk_id, opportunity_id } = await request.json();

    if (!clerk_id || !opportunity_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: clerk_id and opportunity_id",
        }),
        { status: 400 },
      );
    }

    const response = await sql`
      DELETE FROM user_saved_opportunities
      WHERE clerk_id = ${clerk_id} AND opportunity_id = ${opportunity_id};
    `;

    return new Response(JSON.stringify({ data: response }), { status: 200 });
  } catch (error) {
    console.error("Error removing saved opportunity:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
