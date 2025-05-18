// File: /api/fetchdropdowns.ts
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL as string);

    // collapse all dropdown fetches into one SQL call
    const [{ data }] = await sql`
      SELECT json_build_object(
                 'careerInterest',
                 (SELECT json_agg(json_build_object('value', career_interest, 'label', career_interest))
                  FROM career_interest),
                 'extracurricularFormat',
                 (SELECT json_agg(json_build_object('value', format, 'label', format))
                  FROM extracurricular_format),
                 'extracurricularReasons',
                 (SELECT json_agg(json_build_object('value', reason, 'label', reason))
                  FROM extracurricular_reasons),
                 'fieldLevel',
                 (SELECT json_agg(json_build_object('value', level, 'label', level))
                  FROM field_level),
                 'gender',
                 (SELECT json_agg(json_build_object('value', gender, 'label', gender))
                  FROM gender),
                 'grades',
                 (SELECT json_agg(json_build_object('value', grade_level, 'label', grade_level)
                   ORDER BY id)
                  FROM grades),
                 'opportunitySelectivity',
                 (SELECT json_agg(json_build_object('value', selectivity, 'label', selectivity))
                  FROM opportunity_selectivity),
                 'raceEthnicity',
                 (SELECT json_agg(json_build_object('value', race_ethnicity, 'label', race_ethnicity))
                  FROM race_ethnicity),
                 'referralSource',
                 (SELECT json_agg(json_build_object('value', source, 'label', source))
                  FROM referral_source),
                 'satRange',
                 (SELECT json_agg(json_build_object('value', range_text, 'label', range_text))
                  FROM sat_range),
                 'actRange',
                 (SELECT json_agg(json_build_object('value', range_text, 'label', range_text))
                  FROM act_range),
                 'psatRange',
                 (SELECT json_agg(json_build_object('value', range_text, 'label', range_text))
                  FROM psat_range),
                 'weeklyCommitment',
                 (SELECT json_agg(json_build_object('value', commitment, 'label', commitment))
                  FROM weekly_commitment),
                 'yesNo',
                 (SELECT json_agg(json_build_object('value', option, 'label', option))
                  FROM "y-n")
             ) AS data
    `;

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching dropdowns:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
