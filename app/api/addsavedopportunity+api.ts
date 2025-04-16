import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { clerk_id, opportunity_id } = await request.json();

    if (!clerk_id || !opportunity_id) {
      return Response.json(
        { error: "Missing required fields: clerk_id and opportunity_id" },
        { status: 400 },
      );
    }

    const response = await sql`
      INSERT INTO user_saved_opportunities (clerk_id, opportunity_id)
      VALUES (${clerk_id}, ${opportunity_id});
    `;

    return new Response(JSON.stringify({ data: response }), { status: 201 });
  } catch (error) {
    console.error("Error saving opportunity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
