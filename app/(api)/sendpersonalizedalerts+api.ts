import {
  getEligiblePushUserIdsPage,
  sendPersonalizedAlertsToUsers,
} from "@/lib/pushNotifications.server";
import { unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  const expectedSecret = process.env.PUSH_CRON_SECRET;
  if (!expectedSecret) {
    return Response.json(
      { error: "PUSH_CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const providedSecret = request.headers.get("x-push-cron-secret");
  if (providedSecret !== expectedSecret) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetClerkId =
      typeof body?.clerkId === "string" && body.clerkId.trim().length > 0
        ? body.clerkId.trim()
        : null;
    const cursor =
      typeof body?.cursor === "string" && body.cursor.trim().length > 0
        ? body.cursor.trim()
        : null;
    const limit =
      typeof body?.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 5)
        : 1;

    const page = targetClerkId
      ? { clerkIds: [targetClerkId], nextCursor: null }
      : await getEligiblePushUserIdsPage({ cursor, limit });
    const clerkIds = page.clerkIds;
    const result = await sendPersonalizedAlertsToUsers(clerkIds);

    return Response.json(
      {
        ...result,
        limit,
        nextCursor: page.nextCursor,
        targetedClerkId: targetClerkId,
        usedCursor: cursor,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending personalized alerts:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
