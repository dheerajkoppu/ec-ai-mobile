import { neon } from "@neondatabase/serverless";

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { activityId } = await request.json();

    if (!activityId) {
      return Response.json({ error: "Missing activityId" }, { status: 400 });
    }

    const response = await sql`
      DELETE FROM activities
      WHERE id = ${activityId};
    `;

    return new Response(
      JSON.stringify({
        message: "Activity deleted successfully",
        data: response,
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error deleting activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
