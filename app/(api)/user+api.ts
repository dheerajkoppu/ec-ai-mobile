import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function POST(request: Request) {
  let clerkId: string;
  try {
    clerkId = await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert new user into the users table
    const response = await sql`
      INSERT INTO users (
        name,
        email,
        clerk_id
      )
      VALUES (
               ${name},
               ${email},
               ${clerkId}
             );
    `;

    return new Response(JSON.stringify({ data: response }), {
      status: 201,
    });
  } catch (error) {
    console.log("Error creating user:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
