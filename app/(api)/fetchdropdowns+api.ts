import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);

    // No auth or body required — just fetch all dropdown values
    const [
      careerInterest,
      cities,
      extracurricularFormat,
      extracurricularReasons,
      fieldLevel,
      gender,
      grades,
      opportunitySelectivity,
      raceEthnicity,
      referralSource,
      schoolName,
      weeklyCommitment,
      yesNo,
    ] = await Promise.all([
      sql`SELECT career_interest FROM career_interest`,
      sql`SELECT city_name FROM cities`,
      sql`SELECT format FROM extracurricular_format`,
      sql`SELECT reason FROM extracurricular_reasons`,
      sql`SELECT level FROM field_level`,
      sql`SELECT gender FROM gender`,
      sql`SELECT grade_level FROM grades`,
      sql`SELECT selectivity FROM opportunity_selectivity`,
      sql`SELECT race_ethnicity FROM race_ethnicity`,
      sql`SELECT source FROM referral_source`,
      sql`SELECT school_name FROM school_name`,
      sql`SELECT commitment FROM weekly_commitment`,
      sql`SELECT option FROM "y-n"`,
    ]);

    // Helper to format SQL result to { label, value }
    const format = (rows: any[], key: string) =>
      rows.map((row) => ({
        label: row[key],
        value: row[key],
      }));

    return new Response(
      JSON.stringify({
        data: {
          careerInterest: format(careerInterest, "career_interest"),
          cities: format(cities, "city_name"),
          extracurricularFormat: format(extracurricularFormat, "format"),
          extracurricularReasons: format(extracurricularReasons, "reason"),
          fieldLevel: format(fieldLevel, "level"),
          gender: format(gender, "gender"),
          grades: format(grades, "grade_level"),
          opportunitySelectivity: format(opportunitySelectivity, "selectivity"),
          raceEthnicity: format(raceEthnicity, "race_ethnicity"),
          referralSource: format(referralSource, "source"),
          schoolName: format(schoolName, "school_name"),
          weeklyCommitment: format(weeklyCommitment, "commitment"),
          yesNo: format(yesNo, "option"),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching dropdown values:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
