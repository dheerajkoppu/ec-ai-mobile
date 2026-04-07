import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function DELETE(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { activityId } = await request.json();

    if (!activityId) {
      return Response.json({ error: "Missing activityId" }, { status: 400 });
    }

    // Delete only if the activity belongs to the authenticated user
    const result = await sql`
      DELETE FROM activities
      WHERE id = ${activityId}
        AND user_id = (SELECT id FROM users WHERE clerk_id = ${clerkId} LIMIT 1)
      RETURNING id;
    `;

    if (result.length === 0) {
      return Response.json(
        { error: "Activity not found or access denied" },
        { status: 404 },
      );
    }

    return new Response(
      JSON.stringify({ message: "Activity deleted successfully" }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting activity:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
