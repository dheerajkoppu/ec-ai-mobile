import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    const { name, email, clerkID } = await request.json();
    if (!name || !email || !clerkID) {
      return Response.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }
    const response = await sql`
  INSERT INTO users (
    name,
    email,
    clerkID
  )
  VALUES (
    ${name},
    ${email},
    ${clerkID}
  )
`;
    return new Response(JSON.stringify({ data: response }), { status: 201 });
  } catch (error) {
    console.log(error);
    return Response.json({ error: error }, { status: 500 });
  }
}
