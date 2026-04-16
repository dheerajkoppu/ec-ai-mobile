import { sql } from "@/lib/db";
import { deleteServerCacheByPrefix } from "@/lib/serverCache";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { activityId, description } = await request.json();

    if (!activityId || description === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Update only if the activity belongs to the authenticated user
    const updated = await sql`
      UPDATE activities
      SET description = ${description}
      WHERE id = ${activityId}
        AND clerk_id = ${clerkId}
      RETURNING id, description;
    `;

    deleteServerCacheByPrefix(`ai-description:${clerkId}:${String(activityId)}:`);

    return new Response(JSON.stringify({ data: updated }), { status: 200 });
  } catch (error) {
    console.error("Error updating activity description:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
