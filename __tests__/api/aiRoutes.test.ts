import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { POST as getAIDescription } from "@/app/(api)/getaidescription+api";
import { POST as getAIReasons } from "@/app/(api)/getaireasons+api";

const mockSql = jest.fn<(...args: any[]) => Promise<any>>();
const mockRequireAuth = jest.fn<(...args: any[]) => Promise<string>>();
const mockGetOrSetServerCache = jest.fn<(...args: any[]) => Promise<any>>();
const mockCallOpenAIStructured = jest.fn<(...args: any[]) => Promise<any>>();

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
  hashServerCacheValue: (value: unknown) => `hash(${JSON.stringify(value)})`,
}));
jest.mock("@/lib/openai", () => ({
  ...jest.requireActual<typeof import("@/lib/openai")>("@/lib/openai"),
  callOpenAIStructured: (...args: any[]) => mockCallOpenAIStructured(...args),
}));

const post = (
  handler: (request: Request) => Promise<Response>,
  body: Record<string, unknown>,
) =>
  handler(
    new Request("https://ec-ai.expo.app/ai", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
const sentPrompt = () => mockCallOpenAIStructured.mock.calls[0][0] as string;

beforeEach(() => {
  mockSql.mockReset();
  mockRequireAuth.mockReset().mockResolvedValue("user_1");
  // Acts as a cache miss, so the route calls the model
  mockGetOrSetServerCache
    .mockReset()
    .mockImplementation((_key, _ttl, loader) => loader());
  mockCallOpenAIStructured.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("POST /getaireasons", () => {
  const opportunity = {
    activity_name: "Robotics Internship",
    school: null,
    career_field: "Engineering",
    min_gpa: null,
    has_leadership_roles: false,
    only_first_gen: null,
  };

  it("returns the reasons as one numbered string, which is what the app displays", async () => {
    mockSql.mockResolvedValueOnce([opportunity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({
      reasons: ["Builds skills. ", "Selective.", "Mentorship."],
    });

    const response = await post(getAIReasons, { activity_id: 5 });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reasons: "1. Builds skills.\n2. Selective.\n3. Mentorship.",
    });
  });

  it("leaves unknown fields out of the prompt instead of sending null", async () => {
    mockSql.mockResolvedValueOnce([opportunity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({
      reasons: ["a", "b", "c"],
    });

    await post(getAIReasons, { activity_id: 5 });

    expect(sentPrompt()).toContain("Activity Name: Robotics Internship");
    expect(sentPrompt()).toContain("Leadership Roles Available: No");
    expect(sentPrompt()).not.toContain("null");
    expect(sentPrompt()).not.toContain("School/Org");
    expect(sentPrompt()).not.toContain("Minimum GPA");
    expect(sentPrompt()).not.toContain("First-Generation");
  });

  it("tells the model to use only the facts it was given", async () => {
    mockSql.mockResolvedValueOnce([opportunity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({
      reasons: ["a", "b", "c"],
    });

    await post(getAIReasons, { activity_id: 5 });

    expect(sentPrompt()).toContain("Use only the facts listed below");
  });

  it("asks for exactly three reasons", async () => {
    mockSql.mockResolvedValueOnce([opportunity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({
      reasons: ["a", "b", "c"],
    });

    await post(getAIReasons, { activity_id: 5 });

    const { schema } = mockCallOpenAIStructured.mock.calls[0][1];
    expect(schema.properties.reasons).toMatchObject({
      minItems: 3,
      maxItems: 3,
    });
  });

  it("shares one cached answer per opportunity across users", async () => {
    mockSql.mockResolvedValueOnce([opportunity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({
      reasons: ["a", "b", "c"],
    });

    await post(getAIReasons, { activity_id: 5 });

    expect(mockGetOrSetServerCache.mock.calls[0][0]).toBe("ai-reasons:5:v2");
  });

  it("returns 404 for an unknown opportunity without calling the model", async () => {
    mockSql.mockResolvedValueOnce([]);

    const response = await post(getAIReasons, { activity_id: 999 });

    expect(response.status).toBe(404);
    expect(mockCallOpenAIStructured).not.toHaveBeenCalled();
  });

  it("returns 400 when the opportunity id is missing", async () => {
    expect((await post(getAIReasons, {})).status).toBe(400);
  });

  it("returns 401 without a valid token", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

    expect((await post(getAIReasons, { activity_id: 5 })).status).toBe(401);
  });
});

describe("POST /getaidescription", () => {
  const activity = {
    name: "Debate Team",
    roles: "Captain",
    description: null,
    descriptions: ["Ran weekly practice."],
  };

  it("returns the summary as a plain string", async () => {
    mockSql.mockResolvedValueOnce([activity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({
      summary: "  Captained the debate team.  ",
    });

    const response = await post(getAIDescription, { activity_id: 3 });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      description: "Captained the debate team.",
    });
  });

  it("forbids invented numbers and omits the empty description", async () => {
    mockSql.mockResolvedValueOnce([activity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({ summary: "Summary." });

    await post(getAIDescription, { activity_id: 3 });

    expect(sentPrompt()).toContain(
      "Include a number only if it appears in the info below",
    );
    expect(sentPrompt()).toContain("Logged Hours Descriptions: Ran weekly");
    expect(sentPrompt()).not.toContain("Current Description");
  });

  it("only reads an activity that belongs to the signed-in user", async () => {
    mockSql.mockResolvedValueOnce([activity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({ summary: "Summary." });

    await post(getAIDescription, { activity_id: 3 });

    const [, ...values] = mockSql.mock.calls[0];
    expect(values).toEqual(["user_1", 3]);
  });

  it("changes the cache key when the activity text changes", async () => {
    mockSql
      .mockResolvedValueOnce([activity])
      .mockResolvedValueOnce([{ ...activity, roles: "Captain, Treasurer" }]);
    mockCallOpenAIStructured.mockResolvedValue({ summary: "Summary." });

    await post(getAIDescription, { activity_id: 3 });
    await post(getAIDescription, { activity_id: 3 });

    const [firstKey, secondKey] = mockGetOrSetServerCache.mock.calls.map(
      ([key]) => key,
    );
    expect(firstKey).toContain("ai-description:user_1:3:v2:");
    expect(secondKey).not.toBe(firstKey);
  });

  it("fails instead of caching an empty summary", async () => {
    mockSql.mockResolvedValueOnce([activity]);
    mockCallOpenAIStructured.mockResolvedValueOnce({ summary: "   " });

    expect((await post(getAIDescription, { activity_id: 3 })).status).toBe(500);
  });

  it("returns 404 when the activity is not the user's", async () => {
    mockSql.mockResolvedValueOnce([]);

    const response = await post(getAIDescription, { activity_id: 3 });

    expect(response.status).toBe(404);
    expect(mockCallOpenAIStructured).not.toHaveBeenCalled();
  });
});
