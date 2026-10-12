import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  buildPersonalizedAlertForUser,
  getEligiblePushUserIdsPage,
} from "@/lib/pushNotifications.server";

const mockSql = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("@/lib/db", () => ({
  sql: (...args: any[]) => mockSql(...args),
}));

const target = {
  clerk_id: "user_1",
  expo_push_token: "ExponentPushToken[abc]",
  career_interest: ["Law"],
  weekly_commitment: "2-5 hours",
};

// Old enough that the recency bonus is zero and does not affect the ranking
const opportunity = (id: number, careerField: string, hoursPerWeek = 3) => ({
  id,
  activity_name: `Opportunity ${id}`,
  career_field: careerField,
  hours_per_week: hoursPerWeek,
  created_at: "2020-01-01T00:00:00Z",
});

// The function runs four queries in this order
function mockAlertQueries({
  targets = [target],
  likedFields = [] as string[],
  notifiedIds = [] as number[],
  opportunities = [] as ReturnType<typeof opportunity>[],
}) {
  mockSql
    .mockResolvedValueOnce(targets)
    .mockResolvedValueOnce(
      likedFields.map((career_field) => ({ career_field })),
    )
    .mockResolvedValueOnce(
      notifiedIds.map((id) => ({ dedupe_key: `opportunity:${id}` })),
    )
    .mockResolvedValueOnce(opportunities);
}

describe("buildPersonalizedAlertForUser", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("returns nothing for a user with no active push token", async () => {
    mockSql.mockResolvedValueOnce([]);

    await expect(buildPersonalizedAlertForUser("user_1")).resolves.toBeNull();
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it("prefers a field the student liked over one they only listed", async () => {
    mockAlertQueries({
      likedFields: ["Engineering"],
      opportunities: [opportunity(1, "Law"), opportunity(2, "Engineering")],
    });

    const alert = await buildPersonalizedAlertForUser("user_1");

    expect(alert).toMatchObject({
      clerkId: "user_1",
      opportunityId: 2,
      dedupeKey: "opportunity:2",
      pushToken: "ExponentPushToken[abc]",
      title: "Opportunity 2 looks like a fit",
    });
  });

  it("skips an opportunity the student was already notified about", async () => {
    mockAlertQueries({
      likedFields: ["Engineering"],
      notifiedIds: [2],
      opportunities: [opportunity(1, "Law"), opportunity(2, "Engineering")],
    });

    const alert = await buildPersonalizedAlertForUser("user_1");

    expect(alert?.opportunityId).toBe(1);
  });

  it("sends nothing when no opportunity matches the student at all", async () => {
    mockAlertQueries({
      opportunities: [opportunity(1, "Medicine", 12)],
    });

    await expect(buildPersonalizedAlertForUser("user_1")).resolves.toBeNull();
  });

  it("mentions the field and weekly time in the message", async () => {
    mockAlertQueries({
      opportunities: [opportunity(1, "Law")],
    });

    const alert = await buildPersonalizedAlertForUser("user_1");

    expect(alert?.body).toBe(
      "Based on the opportunities you liked and saved, this law option matches your 2-5 hours/week pace.",
    );
  });
});

describe("getEligiblePushUserIdsPage", () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it("returns a cursor when there are more users", async () => {
    mockSql.mockResolvedValueOnce([
      { clerk_id: "user_a" },
      { clerk_id: "user_b" },
      { clerk_id: "user_c" },
    ]);

    await expect(getEligiblePushUserIdsPage({ limit: 2 })).resolves.toEqual({
      clerkIds: ["user_a", "user_b"],
      nextCursor: "user_b",
    });
  });

  it("returns no cursor on the last page", async () => {
    mockSql.mockResolvedValueOnce([{ clerk_id: "user_c" }]);

    await expect(
      getEligiblePushUserIdsPage({ cursor: "user_b", limit: 2 }),
    ).resolves.toEqual({ clerkIds: ["user_c"], nextCursor: null });
  });
});
