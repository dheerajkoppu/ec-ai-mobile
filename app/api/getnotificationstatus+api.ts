import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { email } = await request.json();

    if (!email) {
      return Response.json({ error: "Missing user email" }, { status: 400 });
    }

    const user = await sql`
            SELECT wants_notifications
            FROM users
            WHERE email = ${email};
        `;

    if (user.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return new Response(
      JSON.stringify({ wants_notifications: user[0].wants_notifications }),
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error fetching notifications setting:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
