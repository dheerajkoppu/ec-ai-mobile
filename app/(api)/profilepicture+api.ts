import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { profilePic, clerkId } = await request.json();

    if (!profilePic || !clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Update the user's profile picture
    await sql`
      UPDATE users
      SET profile_picture_url = ${profilePic}
      WHERE clerk_id = ${clerkId};`;

    // Return the profile picture URL back
    return new Response(
      JSON.stringify({
        success: true,
        profilePic,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
