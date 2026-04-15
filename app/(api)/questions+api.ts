import { sql } from "@/lib/db";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

export async function GET(request: Request) {
  try {
    await requireAuth(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    // Run all reference data queries concurrently for efficiency
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
      sql`SELECT * FROM "y-n"`, // Quoted because of hyphen in table name
    ]);

    // Return all form options in a single payload
    return Response.json({
      data: {
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
      },
    });
  } catch (error) {
    console.error("Error fetching questions/options:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
