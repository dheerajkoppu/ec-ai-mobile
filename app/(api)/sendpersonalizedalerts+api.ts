import {
  getEligiblePushUserIds,
  sendPersonalizedAlertsToUsers,
} from "@/lib/pushNotifications.server";

function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

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
    const limit =
      typeof body?.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 200)
        : 50;

    const clerkIds = await getEligiblePushUserIds(limit);
    const result = await sendPersonalizedAlertsToUsers(clerkIds);

    return Response.json(
      {
        ...result,
        limit,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending personalized alerts:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
