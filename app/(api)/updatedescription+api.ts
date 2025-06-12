import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { activityId, description } = await request.json();

    if (!activityId || description === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Update only the description for the given activity ID.
    const updated = await sql`
      UPDATE activities
      SET description = ${description}
      WHERE id = ${activityId}
      RETURNING id, description;
    `;

    return new Response(JSON.stringify({ data: updated }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating activity description:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
