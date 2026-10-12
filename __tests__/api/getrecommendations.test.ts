import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { POST } from "@/app/(api)/getrecommendations+api";

const mockSql = jest.fn<(...args: any[]) => Promise<any>>();
const mockRequireAuth = jest.fn<(...args: any[]) => Promise<string>>();
const mockGetOrSetServerCache = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("@/lib/db", () => ({
  sql: (...args: any[]) => mockSql(...args),
}));
jest.mock("@/lib/serverAuth", () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
jest.mock("@/lib/serverCache", () => ({
  getOrSetServerCache: (...args: any[]) => mockGetOrSetServerCache(...args),
}));

const student = {
  career_interest: ["Engineering"],
  weekly_commitment: "2-5 hours",
  seeking_leadership: true,
  opportunity_selectivity: "High",
  interested_in_travel: false,
  grade_level: "11th Grade",
};

const row = (id: number, careerField: string, alreadySwiped: boolean) => ({
  id,
  activity_name: `Opportunity ${id}`,
  career_field: careerField,
  activity_type: "Club",
  hours_per_week: 3,
  has_leadership_roles: true,
  selectivity_level: "High",
  outside_us: false,
  grade_requirements: ["11th Grade"],
  description: null,
  pictureurl: null,
  prestige: null,
  created_at: "2026-01-01T00:00:00Z",
  already_swiped: alreadySwiped,
});

const request = () =>
  POST(
    new Request("https://ec-ai.expo.app/getrecommendations", {
      method: "POST",
      body: "{}",
    }),
  );

describe("POST /getrecommendations", () => {
  beforeEach(() => {
    mockSql.mockReset();
    mockRequireAuth.mockReset().mockResolvedValue("user_1");
    // Acts as a cache miss, so the route computes the list
    mockGetOrSetServerCache
      .mockReset()
      .mockImplementation((_key, _ttl, loader) => loader());
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns 401 without a valid token", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

    expect((await request()).status).toBe(401);
  });

  it("returns 404 when the user has no profile row", async () => {
    mockSql.mockResolvedValueOnce([]);

    expect((await request()).status).toBe(404);
  });

  it("ranks unswiped opportunities by score and puts swiped ones after them", async () => {
    mockSql.mockResolvedValueOnce([student]).mockResolvedValueOnce([
      row(1, "Law", false),
      row(2, "Engineering", false),
      // A perfect match, but already swiped, so it must not jump the queue
      row(3, "Engineering", true),
      row(4, "Law", true),
    ]);

    const { data } = await (await request()).json();

    expect(data.map((item: { id: number }) => item.id)).toEqual([2, 1, 3, 4]);
    expect(data[0].matchScore).toBe(100);
    expect(data[1].matchScore).toBe(65);
  });

  it("returns only the fields the swipe card reads", async () => {
    mockSql
      .mockResolvedValueOnce([student])
      .mockResolvedValueOnce([row(1, "Law", false)]);

    const { data } = await (await request()).json();

    expect(data[0]).toEqual({
      id: 1,
      title: "Opportunity 1",
      activityType: "Club",
      description: "",
      pictureurl: null,
      prestige: 0,
      matchScore: 65,
    });
  });

  it("caches per user for ten minutes", async () => {
    mockSql.mockResolvedValueOnce([student]).mockResolvedValueOnce([]);

    await request();

    expect(mockGetOrSetServerCache).toHaveBeenCalledWith(
      "recommendations:user_1:v1",
      10 * 60 * 1000,
      expect.any(Function),
    );
  });

  it("marks the response as private to the signed-in user", async () => {
    mockSql.mockResolvedValueOnce([student]).mockResolvedValueOnce([]);

    const response = await request();

    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("Vary")).toBe("Authorization");
  });
});
