import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userClerkId, opportunityId, liked } = await request.json();

    if (!userClerkId || !opportunityId || liked === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const inserted = await sql`
      INSERT INTO user_swipes (user_clerk_id, opportunity_id, liked)
      VALUES (${userClerkId}, ${opportunityId}, ${liked})
        RETURNING *;
    `;

    return new Response(JSON.stringify({ data: inserted }), { status: 200 });
  } catch (error) {
    console.error("Error logging swipe:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
