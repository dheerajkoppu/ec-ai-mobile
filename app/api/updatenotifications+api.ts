import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { email, wants_notifications } = await request.json();

    if (!email || wants_notifications === undefined) {
      return Response.json(
        { error: "Missing email or wants_notifications" },
        { status: 400 },
      );
    }

    const result = await sql`
      UPDATE users
      SET wants_notifications = ${wants_notifications}
      WHERE email = ${email}
      RETURNING wants_notifications;
    `;

    if (result.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(
      {
        message: "Notification preference updated successfully",
        wants_notifications: result[0].wants_notifications,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating notification preference:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
