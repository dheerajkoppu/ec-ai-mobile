#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ENV_PATH = path.resolve(__dirname, "..", ".env");
const PSQL_PATH = process.env.PSQL_PATH || "/opt/homebrew/opt/postgresql@18/bin/psql";
const TABLE_NAME = "opportunities";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, "\n");
  }
}

function usage() {
  console.log(`Usage:
  node scripts/import-opportunities.js <path-to-json> [--apply] [--prune-missing]

Behavior:
  Default mode is dry-run. It compares the JSON against the live Neon table and
  prints what would be inserted, updated, or left alone.

Flags:
  --apply          Execute the upsert against Neon.
  --prune-missing  Delete DB rows whose ids are not present in the JSON.
                   Use this only when the JSON is the full source of truth.
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNullableString(value) {
  if (value === null || value === undefined) return "NULL";
  return sqlString(value);
}

function sqlBoolean(value) {
  if (value === null || value === undefined) return "NULL";
  return value ? "TRUE" : "FALSE";
}

function sqlInteger(value) {
  if (value === null || value === undefined) return "NULL";
  if (!Number.isInteger(value)) {
    throw new Error(`Expected integer, received ${value}`);
  }
  return String(value);
}

function sqlTextArray(value) {
  if (value === null || value === undefined) return "NULL";
  if (!Array.isArray(value)) {
    throw new Error(`Expected array, received ${typeof value}`);
  }
  const items = value.map((entry) => sqlString(entry));
  return `ARRAY[${items.join(", ")}]::text[]`;
}

function normalizeText(value, { maxLength, preserveWhitespace = false } = {}) {
  if (value === null || value === undefined) return null;

  const stringValue = preserveWhitespace ? String(value) : String(value).trim();
  if (!stringValue) return null;
  if (maxLength && stringValue.length > maxLength) {
    throw new Error(
      `Value exceeds max length ${maxLength}: ${stringValue.slice(0, 120)}`,
    );
  }

  return stringValue;
}

function normalizeBoolean(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;

  const lowered = String(value).trim().toLowerCase();
  if (lowered === "true") return true;
  if (lowered === "false") return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

function normalizeInteger(value, fieldName) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) {
    throw new Error(`Invalid integer for ${fieldName}: ${value}`);
  }

  return numberValue;
}

function normalizePgArrayString(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  const stringValue = String(value).trim();
  if (!stringValue) return null;

  if (stringValue.startsWith("{") && stringValue.endsWith("}")) {
    const inner = stringValue.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((entry) => entry.trim().replace(/^"(.*)"$/, "$1"))
      .filter(Boolean);
  }

  return [stringValue];
}

function normalizeDate(value, fieldName) {
  if (value === null || value === undefined || value === "") return null;
  const stringValue = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    throw new Error(`Invalid date for ${fieldName}: ${value}`);
  }
  return stringValue;
}

function normalizeTimestamp(value, fieldName) {
  if (value === null || value === undefined || value === "") return null;
  const stringValue = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2} /.test(stringValue)) {
    throw new Error(`Invalid timestamp for ${fieldName}: ${value}`);
  }
  return stringValue;
}

function normalizeRow(row) {
  const id = normalizeInteger(row.id, "id");
  if (id === null) throw new Error("Each row must include an integer id");

  return {
    id,
    school: normalizeText(row.school, { maxLength: 255 }),
    activity_name: normalizeText(row.activity_name, { maxLength: 255 }),
    career_field: normalizeText(row.career_field, { maxLength: 255 }),
    activity_type: normalizeText(row.activity_type, { maxLength: 255 }),
    location: normalizeText(row.location, { maxLength: 50 }),
    duration: normalizeText(row.duration, { maxLength: 50 }),
    deadline: normalizeDate(row.deadline, "deadline"),
    application_link: normalizeText(row.application_link, { preserveWhitespace: true }),
    grade_requirements: normalizePgArrayString(row.grade_requirements),
    race_requirements: normalizePgArrayString(row.race_requirements),
    gender_requirements: normalizePgArrayString(row.gender_requirements),
    age_requirements: normalizePgArrayString(row.age_requirements),
    primary_city: normalizeText(row.primary_city, { maxLength: 255 }),
    only_frl_students: normalizeBoolean(row.only_frl_students),
    only_first_gen: normalizeBoolean(row.only_first_gen),
    min_gpa: normalizeText(row.min_gpa, { maxLength: 10 }),
    min_sat: normalizeText(row.min_sat, { maxLength: 10 }),
    min_act: normalizeText(row.min_act, { maxLength: 10 }),
    min_psat: normalizeText(row.min_psat, { maxLength: 10 }),
    has_leadership_roles: normalizeBoolean(row.has_leadership_roles),
    selectivity_level: normalizeText(row.selectivity_level, { maxLength: 50 }),
    outside_us: normalizeBoolean(row.outside_us),
    hours_per_week: normalizeText(row.hours_per_week, { maxLength: 20 }),
    description: normalizeText(row.description, {
      maxLength: 500,
      preserveWhitespace: true,
    }),
    pictureurl: normalizeText(row.pictureurl, { preserveWhitespace: true }),
    prestige: normalizeInteger(row.prestige, "prestige"),
    created_at: normalizeTimestamp(row.created_at, "created_at"),
  };
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Input JSON must be an array of opportunity rows");
  }

  const seenIds = new Set();
  return parsed.map((row, index) => {
    const normalized = normalizeRow(row);
    if (seenIds.has(normalized.id)) {
      throw new Error(`Duplicate id ${normalized.id} at row ${index + 1}`);
    }
    seenIds.add(normalized.id);
    return normalized;
  });
}

function runPsql(sql, { capture = true } = {}) {
  const args = [process.env.DATABASE_URL, "-v", "ON_ERROR_STOP=1"];

  if (capture) args.push("-At");
  args.push("-c", sql);

  return execFileSync(PSQL_PATH, args, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
}

function fetchExistingIds() {
  const output = runPsql(`SELECT id FROM ${TABLE_NAME} ORDER BY id`);

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => Number(line));
}

function buildUpsertStatement(row) {
  return `INSERT INTO ${TABLE_NAME} (
    id,
    school,
    activity_name,
    career_field,
    activity_type,
    location,
    duration,
    deadline,
    application_link,
    grade_requirements,
    race_requirements,
    gender_requirements,
    age_requirements,
    primary_city,
    only_frl_students,
    only_first_gen,
    min_gpa,
    min_sat,
    min_act,
    min_psat,
    has_leadership_roles,
    selectivity_level,
    outside_us,
    hours_per_week,
    description,
    pictureurl,
    prestige,
    created_at
  ) VALUES (
    ${sqlInteger(row.id)},
    ${sqlNullableString(row.school)},
    ${sqlNullableString(row.activity_name)},
    ${sqlNullableString(row.career_field)},
    ${sqlNullableString(row.activity_type)},
    ${sqlNullableString(row.location)},
    ${sqlNullableString(row.duration)},
    ${sqlNullableString(row.deadline)},
    ${sqlNullableString(row.application_link)},
    ${sqlTextArray(row.grade_requirements)},
    ${sqlTextArray(row.race_requirements)},
    ${sqlTextArray(row.gender_requirements)},
    ${sqlTextArray(row.age_requirements)},
    ${sqlNullableString(row.primary_city)},
    ${sqlBoolean(row.only_frl_students)},
    ${sqlBoolean(row.only_first_gen)},
    ${sqlNullableString(row.min_gpa)},
    ${sqlNullableString(row.min_sat)},
    ${sqlNullableString(row.min_act)},
    ${sqlNullableString(row.min_psat)},
    ${sqlBoolean(row.has_leadership_roles)},
    ${sqlNullableString(row.selectivity_level)},
    ${sqlBoolean(row.outside_us)},
    ${sqlNullableString(row.hours_per_week)},
    ${sqlNullableString(row.description)},
    ${sqlNullableString(row.pictureurl)},
    ${sqlInteger(row.prestige)},
    ${sqlNullableString(row.created_at)}
  )
  ON CONFLICT (id) DO UPDATE SET
    school = EXCLUDED.school,
    activity_name = EXCLUDED.activity_name,
    career_field = EXCLUDED.career_field,
    activity_type = EXCLUDED.activity_type,
    location = EXCLUDED.location,
    duration = EXCLUDED.duration,
    deadline = EXCLUDED.deadline,
    application_link = EXCLUDED.application_link,
    grade_requirements = EXCLUDED.grade_requirements,
    race_requirements = EXCLUDED.race_requirements,
    gender_requirements = EXCLUDED.gender_requirements,
    age_requirements = EXCLUDED.age_requirements,
    primary_city = EXCLUDED.primary_city,
    only_frl_students = EXCLUDED.only_frl_students,
    only_first_gen = EXCLUDED.only_first_gen,
    min_gpa = EXCLUDED.min_gpa,
    min_sat = EXCLUDED.min_sat,
    min_act = EXCLUDED.min_act,
    min_psat = EXCLUDED.min_psat,
    has_leadership_roles = EXCLUDED.has_leadership_roles,
    selectivity_level = EXCLUDED.selectivity_level,
    outside_us = EXCLUDED.outside_us,
    hours_per_week = EXCLUDED.hours_per_week,
    description = EXCLUDED.description,
    pictureurl = EXCLUDED.pictureurl,
    prestige = EXCLUDED.prestige,
    created_at = EXCLUDED.created_at;`;
}

function main() {
  loadEnvFile(ENV_PATH);

  if (!process.env.DATABASE_URL) {
    fail(`DATABASE_URL is not set. Expected it in ${ENV_PATH} or the shell environment.`);
  }

  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    usage();
    process.exit(0);
  }

  const apply = args.includes("--apply");
  const pruneMissing = args.includes("--prune-missing");
  const jsonPath = args.find((arg) => !arg.startsWith("--"));

  if (!jsonPath) {
    usage();
    fail("Missing path to opportunities JSON.");
  }

  if (!fs.existsSync(PSQL_PATH)) {
    fail(`psql not found at ${PSQL_PATH}. Set PSQL_PATH if yours is somewhere else.`);
  }

  const resolvedJsonPath = path.resolve(process.cwd(), jsonPath);
  if (!fs.existsSync(resolvedJsonPath)) {
    fail(`JSON file not found: ${resolvedJsonPath}`);
  }

  const rows = readJson(resolvedJsonPath);
  const existingIds = fetchExistingIds();

  const fileIdSet = new Set(rows.map((row) => row.id));
  const dbIdSet = new Set(existingIds);

  const missingInDb = rows
    .map((row) => row.id)
    .filter((id) => !dbIdSet.has(id));
  const missingInFile = existingIds.filter((id) => !fileIdSet.has(id));

  console.log(`JSON rows: ${rows.length}`);
  console.log(`DB rows: ${existingIds.length}`);
  console.log(`New ids not currently in DB: ${missingInDb.length}`);
  console.log(`DB ids missing from JSON: ${missingInFile.length}`);

  if (!apply) {
    console.log("Dry run only. No database changes were made.");
    if (missingInDb.length > 0) {
      console.log(`Example ids to insert: ${missingInDb.slice(0, 10).join(", ")}`);
    }
    if (missingInFile.length > 0) {
      console.log(`Example ids not in JSON: ${missingInFile.slice(0, 10).join(", ")}`);
    }
    return;
  }

  const statements = ["BEGIN;"];
  for (const row of rows) {
    statements.push(buildUpsertStatement(row));
  }

  if (pruneMissing) {
    if (rows.length === 0) {
      statements.push(`DELETE FROM ${TABLE_NAME};`);
    } else {
      const idList = rows.map((row) => sqlInteger(row.id)).join(", ");
      statements.push(
        `DELETE FROM ${TABLE_NAME} WHERE id <> ALL(ARRAY[${idList}]::int[]);`,
      );
    }
  }

  statements.push(
    "SELECT setval('opportunities_id_seq', COALESCE((SELECT MAX(id) FROM opportunities), 1), true);",
  );
  statements.push("COMMIT;");

  runPsql(statements.join("\n"), { capture: false });
  console.log("Import complete.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
