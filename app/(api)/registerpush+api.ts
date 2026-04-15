import { registerUserPushToken } from "@/lib/pushNotifications.server";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { expoPushToken, platform } = await request.json();

    if (!expoPushToken || typeof expoPushToken !== "string") {
      return Response.json(
        { error: "Missing required field: expoPushToken" },
        { status: 400 },
      );
    }

    await registerUserPushToken({
      clerkId,
      expoPushToken,
      platform: typeof platform === "string" ? platform : "unknown",
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error registering push token:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
