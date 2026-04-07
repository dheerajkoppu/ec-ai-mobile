import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

// Email is now sent as part of generate-activities-pdf.
// This stub exists for backwards compatibility with older app versions.
export async function POST(request: Request) {
  try {
    await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  return new Response(JSON.stringify({ sent: true }), { status: 200 });
}
