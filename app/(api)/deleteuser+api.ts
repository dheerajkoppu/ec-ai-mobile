import { neon } from "@neondatabase/serverless";

export async function DELETE(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { userEmail } = await request.json();

    if (!userEmail) {
      return Response.json({ error: "Missing userEmail" }, { status: 400 });
    }

    // Step 1: Get the user ID
    const userIdResult = await sql`
      SELECT id FROM users WHERE email = ${userEmail} LIMIT 1;
    `;

    const userId = userIdResult[0]?.id;

    if (!userId) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Step 2: Delete activities tied to that user
    await sql`
      DELETE FROM activities WHERE user_id = ${userId};
    `;

    // Step 3 (optional): Delete user from users table
    await sql`
       DELETE FROM users WHERE id = ${userId};
     `;

    return new Response(
      JSON.stringify({ message: "User activities deleted successfully." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user and activities:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
