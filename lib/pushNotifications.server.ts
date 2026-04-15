import { sql } from "@/lib/db";

const EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";
const MAX_MESSAGES_PER_REQUEST = 100;
const PERSONALIZED_ALERT_TYPE = "personalized_opportunity";

type PushTarget = {
  clerk_id: string;
  expo_push_token: string;
  career_interest: string[] | string | null;
  weekly_commitment: string | null;
};

type OpportunityCandidate = {
  id: number;
  activity_name: string | null;
  career_field: string | null;
  hours_per_week: number | string | null;
  created_at: string | Date | null;
};

type PersonalizedAlertCandidate = {
  body: string;
  clerkId: string;
  dedupeKey: string;
  opportunityId: number;
  pushToken: string;
  title: string;
};

type ExpoPushMessage = {
  body: string;
  channelId?: string;
  data?: Record<string, unknown>;
  sound?: "default";
  title: string;
  to: string;
};

export async function ensurePushNotificationInfrastructure(): Promise<void> {
  await Promise.all([
    sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS wants_notifications BOOLEAN DEFAULT FALSE;
    `,
    sql`
      CREATE TABLE IF NOT EXISTS user_push_tokens (
        id BIGSERIAL PRIMARY KEY,
        clerk_id TEXT NOT NULL,
        expo_push_token TEXT NOT NULL UNIQUE,
        platform TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    sql`
      CREATE TABLE IF NOT EXISTS user_notification_history (
        id BIGSERIAL PRIMARY KEY,
        clerk_id TEXT NOT NULL,
        notification_type TEXT NOT NULL,
        dedupe_key TEXT NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (clerk_id, notification_type, dedupe_key)
      );
    `,
  ]);
}

export async function registerUserPushToken({
  clerkId,
  expoPushToken,
  platform,
}: {
  clerkId: string;
  expoPushToken: string;
  platform: string;
}): Promise<void> {
  await ensurePushNotificationInfrastructure();

  await sql`
    INSERT INTO user_push_tokens (
      clerk_id,
      expo_push_token,
      platform,
      is_active,
      last_seen_at,
      updated_at
    )
    VALUES (
      ${clerkId},
      ${expoPushToken},
      ${platform},
      TRUE,
      NOW(),
      NOW()
    )
    ON CONFLICT (expo_push_token) DO UPDATE
    SET
      clerk_id = EXCLUDED.clerk_id,
      platform = EXCLUDED.platform,
      is_active = TRUE,
      last_seen_at = NOW(),
      updated_at = NOW();
  `;

  await sql`
    UPDATE users
    SET wants_notifications = TRUE
    WHERE clerk_id = ${clerkId};
  `;
}

export async function updateUserNotificationPreference({
  clerkId,
  enabled,
}: {
  clerkId: string;
  enabled: boolean;
}): Promise<void> {
  await ensurePushNotificationInfrastructure();

  await sql`
    UPDATE users
    SET wants_notifications = ${enabled}
    WHERE clerk_id = ${clerkId};
  `;

  if (!enabled) {
    await sql`
      UPDATE user_push_tokens
      SET is_active = FALSE, updated_at = NOW()
      WHERE clerk_id = ${clerkId};
    `;
  }
}

export async function deactivatePushToken(
  expoPushToken: string,
): Promise<void> {
  await sql`
    UPDATE user_push_tokens
    SET is_active = FALSE, updated_at = NOW()
    WHERE expo_push_token = ${expoPushToken};
  `;
}

export async function buildPersonalizedAlertForUser(
  clerkId: string,
): Promise<PersonalizedAlertCandidate | null> {
  const [target] = (await sql`
    SELECT
      upt.clerk_id,
      upt.expo_push_token,
      u.career_interest,
      u.weekly_commitment
    FROM user_push_tokens upt
    INNER JOIN users u
      ON u.clerk_id = upt.clerk_id
    WHERE upt.clerk_id = ${clerkId}
      AND upt.is_active = TRUE
      AND u.wants_notifications = TRUE
    ORDER BY upt.last_seen_at DESC
    LIMIT 1;
  `) as PushTarget[];

  if (!target) return null;

  const signalFields = await getSignalFieldsForUser(clerkId);
  const statedInterests = normalizeStringArray(target.career_interest);
  const notifiedKeys = await getNotifiedOpportunityKeys(clerkId);

  const opportunities = (await sql`
    SELECT
      id,
      activity_name,
      career_field,
      hours_per_week,
      created_at
    FROM opportunities
    WHERE id NOT IN (
      SELECT opportunity_id
      FROM user_saved_opportunities
      WHERE clerk_id = ${clerkId}
    )
    ORDER BY created_at DESC
    LIMIT 120;
  `) as OpportunityCandidate[];

  const bestMatch = opportunities
    .filter((opportunity) => {
      return !notifiedKeys.has(`opportunity:${opportunity.id}`);
    })
    .map((opportunity) => ({
      opportunity,
      score: calculateAlertScore({
        opportunity,
        signalFields,
        statedInterests,
        weeklyCommitment: target.weekly_commitment ?? "",
      }),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0];

  if (!bestMatch) return null;

  return {
    body: buildAlertBody(bestMatch.opportunity, signalFields, statedInterests),
    clerkId,
    dedupeKey: `opportunity:${bestMatch.opportunity.id}`,
    opportunityId: bestMatch.opportunity.id,
    pushToken: target.expo_push_token,
    title: buildAlertTitle(bestMatch.opportunity),
  };
}

export async function sendPersonalizedAlertsToUsers(
  clerkIds: string[],
): Promise<{
  candidates: number;
  considered: number;
  failed: number;
  failureReasons: string[];
  sent: number;
}> {
  const candidateResults = await Promise.allSettled(
    clerkIds.map((clerkId) => buildPersonalizedAlertForUser(clerkId)),
  );

  const candidates = candidateResults
    .filter(
      (
        result,
      ): result is PromiseFulfilledResult<PersonalizedAlertCandidate | null> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)
    .filter(Boolean) as PersonalizedAlertCandidate[];

  const failed = candidateResults.filter(
    (result) => result.status === "rejected",
  ).length;
  const failureReasons = candidateResults
    .filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
    .map((result) => {
      if (result.reason instanceof Error) return result.reason.message;
      return String(result.reason);
    })
    .slice(0, 3);

  const results = await sendExpoPushMessages(
    candidates.map((candidate) => ({
      body: candidate.body,
      channelId: "default",
      data: {
        opportunityId: candidate.opportunityId,
        screen: "/(root)/(tabs)/opportunity_match",
        type: PERSONALIZED_ALERT_TYPE,
      },
      sound: "default",
      title: candidate.title,
      to: candidate.pushToken,
    })),
  );

  const successfulCandidates: PersonalizedAlertCandidate[] = [];
  const tokensToDeactivate: string[] = [];

  for (const [index, ticket] of results.entries()) {
    const candidate = candidates[index];
    if (!candidate) continue;

    if (ticket?.status === "ok") {
      successfulCandidates.push(candidate);
      continue;
    }

    if (ticket?.details?.error === "DeviceNotRegistered") {
      tokensToDeactivate.push(candidate.pushToken);
    }
  }

  if (tokensToDeactivate.length > 0) {
    await sql`
      UPDATE user_push_tokens
      SET is_active = FALSE, updated_at = NOW()
      WHERE expo_push_token = ANY(${tokensToDeactivate}::text[]);
    `;
  }

  if (successfulCandidates.length > 0) {
    await recordNotificationHistory(successfulCandidates);
  }

  return {
    candidates: candidates.length,
    considered: clerkIds.length,
    failed,
    failureReasons,
    sent: successfulCandidates.length,
  };
}

export async function getEligiblePushUserIdsPage({
  cursor,
  limit = 5,
}: {
  cursor?: string | null;
  limit?: number;
}): Promise<{ clerkIds: string[]; nextCursor: string | null }> {
  const rows = (
    cursor
      ? await sql`
        SELECT DISTINCT u.clerk_id
        FROM users u
        INNER JOIN user_push_tokens upt
          ON upt.clerk_id = u.clerk_id
        WHERE u.wants_notifications = TRUE
          AND upt.is_active = TRUE
          AND u.clerk_id > ${cursor}
        ORDER BY u.clerk_id
        LIMIT ${limit + 1};
      `
      : await sql`
        SELECT DISTINCT u.clerk_id
        FROM users u
        INNER JOIN user_push_tokens upt
          ON upt.clerk_id = u.clerk_id
        WHERE u.wants_notifications = TRUE
          AND upt.is_active = TRUE
        ORDER BY u.clerk_id
        LIMIT ${limit + 1};
      `
  ) as Array<{ clerk_id: string }>;

  const pageRows = rows.slice(0, limit);
  const nextCursor =
    rows.length > limit
      ? (pageRows[pageRows.length - 1]?.clerk_id ?? null)
      : null;

  return {
    clerkIds: pageRows.map((row) => row.clerk_id),
    nextCursor,
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item)
          .trim()
          .replace(/^"+|"+$/g, ""),
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^"+|"+$/g, ""))
        .filter(Boolean);
    }

    return [trimmed.replace(/^"+|"+$/g, "")];
  }

  return [];
}

async function getSignalFieldsForUser(clerkId: string): Promise<string[]> {
  const rows = (await sql`
    SELECT career_field
    FROM (
      SELECT o.career_field
      FROM opportunities o
      INNER JOIN user_saved_opportunities uso ON uso.opportunity_id = o.id
      WHERE uso.clerk_id = ${clerkId}

      UNION ALL

      SELECT o.career_field
      FROM opportunities o
      INNER JOIN user_swipes us ON us.opportunity_id = o.id
      WHERE us.user_clerk_id = ${clerkId}
        AND us.liked = TRUE
    ) sub
    WHERE career_field IS NOT NULL AND career_field <> ''
    GROUP BY career_field
    ORDER BY COUNT(*) DESC;
  `) as Array<{ career_field: string }>;

  return rows.map((row) => row.career_field);
}

async function getNotifiedOpportunityKeys(
  clerkId: string,
): Promise<Set<string>> {
  const rows = (await sql`
    SELECT dedupe_key
    FROM user_notification_history
    WHERE clerk_id = ${clerkId}
      AND notification_type = ${PERSONALIZED_ALERT_TYPE};
  `) as Array<{ dedupe_key: string }>;

  return new Set(rows.map((row) => row.dedupe_key));
}

function mapTimeRange(label: string): number {
  switch (label) {
    case "<2 hours":
      return 1;
    case "2-5 hours":
      return 2;
    case "5-10 hours":
      return 3;
    case "10+ hours":
      return 4;
    default:
      return 0;
  }
}

function hoursToLabel(hours: number | string | null): string {
  if (typeof hours === "string") return hours;
  if (typeof hours !== "number") return "";
  if (hours < 2) return "<2 hours";
  if (hours < 5) return "2-5 hours";
  if (hours < 10) return "5-10 hours";
  return "10+ hours";
}

function calculateAlertScore({
  opportunity,
  signalFields,
  statedInterests,
  weeklyCommitment,
}: {
  opportunity: OpportunityCandidate;
  signalFields: string[];
  statedInterests: string[];
  weeklyCommitment: string;
}): number {
  let score = 0;
  const opportunityField = opportunity.career_field?.trim() ?? "";

  if (signalFields.includes(opportunityField)) {
    score += 80;
  }

  if (statedInterests.includes(opportunityField)) {
    score += 50;
  }

  const preferredTime = mapTimeRange(weeklyCommitment);
  const opportunityTime = mapTimeRange(
    hoursToLabel(opportunity.hours_per_week),
  );
  const difference = Math.abs(preferredTime - opportunityTime);

  if (preferredTime && opportunityTime) {
    if (difference === 0) score += 40;
    else if (difference === 1) score += 20;
  }

  const createdAt =
    opportunity.created_at instanceof Date
      ? opportunity.created_at.getTime()
      : opportunity.created_at
        ? new Date(opportunity.created_at).getTime()
        : 0;

  if (createdAt) {
    const ageInDays = Math.floor(
      (Date.now() - createdAt) / (1000 * 60 * 60 * 24),
    );
    score += Math.max(0, 14 - ageInDays);
  }

  return score;
}

function buildAlertTitle(opportunity: OpportunityCandidate): string {
  const title = opportunity.activity_name?.trim();
  if (!title) return "New opportunity picked for you";
  return `${title} looks like a fit`;
}

function buildAlertBody(
  opportunity: OpportunityCandidate,
  signalFields: string[],
  statedInterests: string[],
): string {
  const field =
    opportunity.career_field?.trim() || signalFields[0] || statedInterests[0];
  const timeLabel = hoursToLabel(opportunity.hours_per_week);

  if (field && timeLabel) {
    return `Based on the opportunities you liked and saved, this ${field.toLowerCase()} option matches your ${timeLabel}/week pace.`;
  }

  if (field) {
    return `Based on the opportunities you liked and saved, this ${field.toLowerCase()} opportunity is worth a look.`;
  }

  return "Based on your recent activity, we found a new opportunity that looks worth checking out.";
}

async function recordNotificationHistory(
  candidates: PersonalizedAlertCandidate[],
): Promise<void> {
  const clerkIds = candidates.map((candidate) => candidate.clerkId);
  const types = candidates.map(() => PERSONALIZED_ALERT_TYPE);
  const dedupeKeys = candidates.map((candidate) => candidate.dedupeKey);

  await sql`
    INSERT INTO user_notification_history (clerk_id, notification_type, dedupe_key)
    SELECT * FROM UNNEST(
      ${clerkIds}::text[],
      ${types}::text[],
      ${dedupeKeys}::text[]
    ) AS t(clerk_id, notification_type, dedupe_key)
    ON CONFLICT (clerk_id, notification_type, dedupe_key) DO NOTHING;
  `;
}

async function sendExpoPushMessages(
  messages: ExpoPushMessage[],
): Promise<Array<{ details?: { error?: string }; status?: string }>> {
  const tickets: Array<{ details?: { error?: string }; status?: string }> = [];

  for (
    let index = 0;
    index < messages.length;
    index += MAX_MESSAGES_PER_REQUEST
  ) {
    const chunk = messages.slice(index, index + MAX_MESSAGES_PER_REQUEST);

    const response = await fetch(EXPO_PUSH_API_URL, {
      body: JSON.stringify(chunk),
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(
        `Expo push API request failed with status ${response.status}: ${JSON.stringify(json)}`,
      );
    }

    if (Array.isArray(json?.data)) {
      tickets.push(...json.data);
    }
  }

  return tickets;
}
