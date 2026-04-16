import { sql } from "@/lib/db";
import { getOrSetServerCache } from "@/lib/serverCache";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

const LOOKUP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PRIVATE_CACHE_CONTROL =
  "private, max-age=86400, stale-while-revalidate=604800";

export async function GET(request: Request) {
  try {
    await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const data = await getOrSetServerCache(
      "lookups:questions:v1",
      LOOKUP_CACHE_TTL_MS,
      async () => {
        const [
          questions,
          career_interest,
          cities,
          extracurricular_format,
          extracurricular_reasons,
          field_level,
          gender,
          grades,
          opportunity_selectivity,
          race_ethnicity,
          referral_source,
          school_name,
          weekly_commitment,
          y_n,
        ] = await Promise.all([
          sql`SELECT * FROM questions`,
          sql`SELECT * FROM career_interest`,
          sql`SELECT * FROM cities`,
          sql`SELECT * FROM extracurricular_format`,
          sql`SELECT * FROM extracurricular_reasons`,
          sql`SELECT * FROM field_level`,
          sql`SELECT * FROM gender`,
          sql`SELECT * FROM grades`,
          sql`SELECT * FROM opportunity_selectivity`,
          sql`SELECT * FROM race_ethnicity`,
          sql`SELECT * FROM referral_source`,
          sql`SELECT * FROM school_name`,
          sql`SELECT * FROM weekly_commitment`,
          sql`SELECT * FROM "y-n"`,
        ]);

        return {
          questions,
          career_interest,
          cities,
          extracurricular_format,
          extracurricular_reasons,
          field_level,
          gender,
          grades,
          opportunity_selectivity,
          race_ethnicity,
          referral_source,
          school_name,
          weekly_commitment,
          y_n,
        };
      },
    );

    return Response.json(
      { data },
      {
        headers: {
          "Cache-Control": PRIVATE_CACHE_CONTROL,
          Vary: "Authorization",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching questions/options:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
