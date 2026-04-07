import { verifyToken } from "@clerk/backend";

/**
 * Verifies the Clerk JWT from the Authorization header and returns the
 * authenticated clerk user ID (the `sub` claim). Throws on failure.
 */
export async function requireAuth(request: Request): Promise<string> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing Bearer token");
  }
  const token = authHeader.slice(7);
  // Guard against clients sending "Bearer null" or "Bearer undefined"
  if (!token || token === "null" || token === "undefined") {
    throw new Error("Unauthorized: null token received from client");
  }
  if (!process.env.CLERK_SECRET_KEY) {
    console.error(
      "CLERK_SECRET_KEY is not set — token verification will always fail",
    );
    throw new Error("Unauthorized: server misconfiguration");
  }
  try {
    const payload = await verifyToken(token, {
      // If CLERK_JWT_KEY is set, verification is fully local (no network call).
      // Get it from Clerk dashboard → Configure → API Keys → JWT public key.
      ...(process.env.CLERK_JWT_KEY
        ? { jwtKey: process.env.CLERK_JWT_KEY }
        : { secretKey: process.env.CLERK_SECRET_KEY }),
    });
    return payload.sub;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Unauthorized");
  }
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
