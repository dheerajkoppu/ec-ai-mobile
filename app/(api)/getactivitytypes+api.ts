import { sql } from "@/lib/db";
import { getOrSetServerCache } from "@/lib/serverCache";

const LOOKUP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PUBLIC_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: Request) {
  try {
    const formatted = await getOrSetServerCache(
      "lookups:activity-types:v1",
      LOOKUP_CACHE_TTL_MS,
      async () => {
        const response = await sql`
          SELECT name FROM activityTypes ORDER BY name ASC;
        `;

        return response.map((row: any) => ({
          label: row.name,
          value: row.name.toLowerCase().replace(/[^\w]+/g, "-"),
        }));
      },
    );

    return new Response(JSON.stringify({ data: formatted }), {
      status: 200,
      headers: {
        "Cache-Control": PUBLIC_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error fetching activity types:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
