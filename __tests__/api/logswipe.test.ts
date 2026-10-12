import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { POST } from "@/app/(api)/logswipe+api";

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

const swipe = (body: Record<string, unknown>) =>
  POST(
    new Request("https://ec-ai.expo.app/logswipe", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

describe("POST /logswipe", () => {
  beforeEach(() => {
    mockSql.mockReset().mockResolvedValue([{ id: 1 }]);
    mockRequireAuth.mockReset().mockResolvedValue("user_1");
    mockDeleteServerCache.mockReset().mockResolvedValue(undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns 401 without a valid token", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

    expect((await swipe({ opportunityId: 7, liked: true })).status).toBe(401);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("records the swipe for the signed-in user", async () => {
    const response = await swipe({ opportunityId: "7", liked: false });

    expect(response.status).toBe(200);
    const [, ...values] = mockSql.mock.calls[0];
    expect(values).toEqual(["user_1", 7, false]);
  });

  it("clears the cached recommendations so the swiped card drops back", async () => {
    await swipe({ opportunityId: 7, liked: true });

    expect(mockDeleteServerCache).toHaveBeenCalledWith(
      "recommendations:user_1:v1",
    );
  });

  it.each([{ liked: true }, { opportunityId: 7 }, {}])(
    "returns 400 for the incomplete body %p",
    async (body) => {
      expect((await swipe(body)).status).toBe(400);
      expect(mockSql).not.toHaveBeenCalled();
    },
  );

  it.each(["abc", "7; DROP TABLE users", "-3", "1.5"])(
    "returns 400 for the opportunity id %p",
    async (opportunityId) => {
      const response = await swipe({ opportunityId, liked: true });

      expect(response.status).toBe(400);
      expect(mockSql).not.toHaveBeenCalled();
    },
  );
});
