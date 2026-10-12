import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { POST } from "@/app/(api)/sendpersonalizedalerts+api";

const mockGetPage = jest.fn<(...args: any[]) => Promise<any>>();
const mockSendAlerts = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("@/lib/pushNotifications.server", () => ({
  getEligiblePushUserIdsPage: (...args: any[]) => mockGetPage(...args),
  sendPersonalizedAlertsToUsers: (...args: any[]) => mockSendAlerts(...args),
}));
jest.mock("@/lib/serverAuth", () => ({
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

const trigger = (body: Record<string, unknown>, secret?: string) =>
  POST(
    new Request("https://ec-ai.expo.app/sendpersonalizedalerts", {
      method: "POST",
      headers: secret ? { "x-push-cron-secret": secret } : {},
      body: JSON.stringify(body),
    }),
  );

describe("POST /sendpersonalizedalerts", () => {
  beforeEach(() => {
    process.env.PUSH_CRON_SECRET = "cron-secret";
    mockGetPage
      .mockReset()
      .mockResolvedValue({ clerkIds: ["user_a"], nextCursor: "user_a" });
    mockSendAlerts.mockReset().mockResolvedValue({
      candidates: 1,
      considered: 1,
      failed: 0,
      failureReasons: [],
      sent: 1,
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it.each([undefined, "wrong-secret"])(
    "returns 401 for the secret %p and sends nothing",
    async (secret) => {
      expect((await trigger({}, secret)).status).toBe(401);
      expect(mockSendAlerts).not.toHaveBeenCalled();
    },
  );

  it("returns 500 when no secret is configured, so the route is never open", async () => {
    delete process.env.PUSH_CRON_SECRET;

    expect((await trigger({}, "cron-secret")).status).toBe(500);
    expect(mockSendAlerts).not.toHaveBeenCalled();
  });

  it("sends to one page of users and returns the next cursor", async () => {
    const response = await trigger({ limit: 5 }, "cron-secret");

    expect(response.status).toBe(200);
    expect(mockSendAlerts).toHaveBeenCalledWith(["user_a"]);
    await expect(response.json()).resolves.toMatchObject({
      sent: 1,
      limit: 5,
      nextCursor: "user_a",
    });
  });

  it("never handles more than five users in one request", async () => {
    await trigger({ limit: 500 }, "cron-secret");

    expect(mockGetPage).toHaveBeenCalledWith({ cursor: null, limit: 5 });
  });

  it("handles one user when no limit is given", async () => {
    await trigger({}, "cron-secret");

    expect(mockGetPage).toHaveBeenCalledWith({ cursor: null, limit: 1 });
  });

  it("continues from the cursor it is given", async () => {
    await trigger({ limit: 5, cursor: "user_m" }, "cron-secret");

    expect(mockGetPage).toHaveBeenCalledWith({ cursor: "user_m", limit: 5 });
  });

  it("can target a single user for testing", async () => {
    const response = await trigger({ clerkId: "user_z" }, "cron-secret");

    expect(mockGetPage).not.toHaveBeenCalled();
    expect(mockSendAlerts).toHaveBeenCalledWith(["user_z"]);
    await expect(response.json()).resolves.toMatchObject({
      targetedClerkId: "user_z",
      nextCursor: null,
    });
  });
});
