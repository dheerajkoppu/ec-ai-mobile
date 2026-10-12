import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { POST } from "@/app/(api)/userdata+api";

const mockSql = jest.fn<(...args: any[]) => Promise<any>>();
const mockRequireAuth = jest.fn<(...args: any[]) => Promise<string>>();
const mockDeleteServerCache = jest.fn<(...args: any[]) => Promise<void>>();

jest.mock("@/lib/db", () => ({
  sql: (...args: any[]) => mockSql(...args),
}));
jest.mock("@/lib/serverAuth", () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
jest.mock("@/lib/serverCache", () => ({
  deleteServerCache: (...args: any[]) => mockDeleteServerCache(...args),
}));

const profile = {
  name: "Ada",
  gradeLevel: "11th Grade",
  age: "17",
  gpaWeighted: "4.2",
  gpaUnweighted: "3.85",
  satScore: "1200-1390",
  actScore: "None",
  psatScore: "1400+",
  leadership: "Yes",
  travel: "No",
  agreeTerms: "Yes",
};

const submit = (body: Record<string, unknown>) =>
  POST(
    new Request("https://ec-ai.expo.app/userdata", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

// Pairs each value in the UPDATE with the column it is assigned to
function updatedColumns(): Record<string, unknown> {
  const [strings, ...values] = mockSql.mock.calls[1];
  const columns: Record<string, unknown> = {};

  values.forEach((value: unknown, index: number) => {
    const column = /(\w+) = $/.exec(strings[index])?.[1];
    if (column) columns[column] = value;
  });

  return columns;
}

describe("POST /userdata", () => {
  beforeEach(() => {
    mockSql.mockReset();
    mockRequireAuth.mockReset().mockResolvedValue("user_1");
    mockDeleteServerCache.mockReset().mockResolvedValue(undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns 401 without a valid token", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

    const response = await submit(profile);

    expect(response.status).toBe(401);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("saves parsed numbers and stores a score of None as null", async () => {
    mockSql
      .mockResolvedValueOnce([{ email: "ada@example.com" }])
      .mockResolvedValueOnce([]);

    const response = await submit(profile);

    expect(response.status).toBe(200);
    expect(updatedColumns()).toMatchObject({
      name: "Ada",
      age: 17,
      gpa_weighted: 4.2,
      gpa_unweighted: 3.85,
      sat_score: 1200,
      act_score: null,
      psat_score: 1400,
      seeking_leadership: true,
      interested_in_travel: false,
      agreed_to_terms: true,
    });
  });

  it("only updates the signed-in user's row", async () => {
    mockSql
      .mockResolvedValueOnce([{ email: "ada@example.com" }])
      .mockResolvedValueOnce([]);

    await submit(profile);

    const [strings, ...values] = mockSql.mock.calls[1];
    expect(strings[strings.length - 2]).toContain("WHERE clerk_id = ");
    expect(values[values.length - 1]).toBe("user_1");
  });

  it("falls back to the email when no name is given", async () => {
    mockSql
      .mockResolvedValueOnce([{ email: "ada@example.com" }])
      .mockResolvedValueOnce([]);

    await submit({ ...profile, name: "" });

    expect(updatedColumns().name).toBe("ada@example.com");
  });

  it("clears the cached recommendations, since they depend on the profile", async () => {
    mockSql
      .mockResolvedValueOnce([{ email: "ada@example.com" }])
      .mockResolvedValueOnce([]);

    await submit(profile);

    expect(mockDeleteServerCache).toHaveBeenCalledWith(
      "recommendations:user_1:v1",
    );
  });

  it.each([
    [{ gpaWeighted: "95" }, "Weighted GPA must be a number between 0 and 9.99"],
    [{ age: "abc" }, "Age must be a number between 1 and 120"],
    [{ satScore: "2000" }, "SAT score must be a number between 400 and 1600"],
  ])("returns 400 for %p and writes nothing", async (change, message) => {
    const response = await submit({ ...profile, ...change });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: message });
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("returns 404 when the user has no profile row", async () => {
    mockSql.mockResolvedValueOnce([]);

    const response = await submit(profile);

    expect(response.status).toBe(404);
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the database fails", async () => {
    mockSql.mockRejectedValueOnce(new Error("connection lost"));

    const response = await submit(profile);

    expect(response.status).toBe(500);
  });
});
