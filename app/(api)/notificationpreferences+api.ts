import { updateUserNotificationPreference } from "@/lib/pushNotifications.server";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { enabled } = await request.json();

    if (typeof enabled !== "boolean") {
      return Response.json(
        { error: "Missing required boolean field: enabled" },
        { status: 400 },
      );
    }

    await updateUserNotificationPreference({ clerkId, enabled });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating notification preference:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
