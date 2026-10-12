import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { DELETE as deleteUser } from "@/app/(api)/deleteuser+api";
import { POST as exportData } from "@/app/(api)/exportdata+api";
import { POST as reportOpportunity } from "@/app/(api)/reportopportunity+api";

const mockSql = jest.fn<(...args: any[]) => Promise<any>>();
const mockRequireAuth = jest.fn<(...args: any[]) => Promise<string>>();
const mockSendEmail = jest.fn<(...args: any[]) => Promise<void>>();
const mockGetUser = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("@/lib/db", () => ({
  sql: (...args: any[]) => mockSql(...args),
}));
jest.mock("@/lib/serverAuth", () => ({
  requireAuth: (...args: any[]) => mockRequireAuth(...args),
  unauthorizedResponse: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),
}));
jest.mock("@/lib/resend", () => ({
  FROM_ADDRESS: "EC-AI <support@ec-ai.app>",
  sendEmail: (...args: any[]) => mockSendEmail(...args),
}));
jest.mock("@clerk/backend", () => ({
  createClerkClient: () => ({
    users: { getUser: (...args: any[]) => mockGetUser(...args) },
  }),
}));

const call = (
  handler: (request: Request) => Promise<Response>,
  method: string,
  body: Record<string, unknown> = {},
) =>
  handler(
    new Request("https://ec-ai.expo.app/route", {
      method,
      body: JSON.stringify(body),
    }),
  );

const emailFailure = new Error("Resend rate_limit_exceeded: Too many requests");

beforeEach(() => {
  mockSql.mockReset();
  mockRequireAuth.mockReset().mockResolvedValue("user_1");
  mockSendEmail.mockReset().mockResolvedValue(undefined);
  mockGetUser.mockReset().mockResolvedValue({
    primaryEmailAddressId: "email_2",
    emailAddresses: [
      { id: "email_1", emailAddress: "old@example.com" },
      { id: "email_2", emailAddress: "ada@example.com" },
    ],
  });
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("POST /reportopportunity", () => {
  const report = { opportunity_id: "12", reason: "Scam", details: "" };

  it("stores the report and notifies the admin", async () => {
    mockSql.mockResolvedValueOnce([]);

    const response = await call(reportOpportunity, "POST", report);

    expect(response.status).toBe(200);
    const [, ...values] = mockSql.mock.calls[0];
    expect(values).toEqual(["user_1", 12, "Scam", null]);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  // The report is already saved, so the student should not see an error
  it("still succeeds when the notification email fails", async () => {
    mockSql.mockResolvedValueOnce([]);
    mockSendEmail.mockRejectedValueOnce(emailFailure);

    const response = await call(reportOpportunity, "POST", report);

    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalledWith(
      "Report notice failed for opportunity 12:",
      emailFailure,
    );
  });

  it.each([{ reason: "Scam" }, { opportunity_id: "12" }])(
    "returns 400 for the incomplete report %p",
    async (body) => {
      expect((await call(reportOpportunity, "POST", body)).status).toBe(400);
      expect(mockSql).not.toHaveBeenCalled();
    },
  );

  it("returns 400 for an opportunity id that is not a number", async () => {
    const response = await call(reportOpportunity, "POST", {
      ...report,
      opportunity_id: "twelve",
    });

    expect(response.status).toBe(400);
    expect(mockSql).not.toHaveBeenCalled();
  });
});

describe("DELETE /deleteuser", () => {
  it("deletes the signed-in user and notifies the admin", async () => {
    mockSql.mockResolvedValueOnce([{ email: "ada@example.com" }]);

    const response = await call(deleteUser, "DELETE");

    expect(response.status).toBe(200);
    const [, ...values] = mockSql.mock.calls[0];
    expect(values).toEqual(["user_1", "user_1"]);
    expect(mockSendEmail.mock.calls[0][0].text).toContain("ada@example.com");
  });

  // The rows are already gone, so failing here would strand the user signed in
  it("still succeeds when the notification email fails", async () => {
    mockSql.mockResolvedValueOnce([{ email: "ada@example.com" }]);
    mockSendEmail.mockRejectedValueOnce(emailFailure);

    const response = await call(deleteUser, "DELETE");

    expect(response.status).toBe(200);
    expect(console.error).toHaveBeenCalledWith(
      "Deletion notice failed for user_1:",
      emailFailure,
    );
  });

  it("returns 404 when there is no row to delete", async () => {
    mockSql.mockResolvedValueOnce([]);

    const response = await call(deleteUser, "DELETE");

    expect(response.status).toBe(404);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("returns 401 without a valid token", async () => {
    mockRequireAuth.mockRejectedValueOnce(new Error("Unauthorized"));

    expect((await call(deleteUser, "DELETE")).status).toBe(401);
    expect(mockSql).not.toHaveBeenCalled();
  });
});

describe("POST /exportdata", () => {
  it("uses the primary email on the Clerk account, not one from the request", async () => {
    const response = await call(exportData, "POST", {
      email: "attacker@example.com",
    });

    expect(response.status).toBe(200);
    expect(mockGetUser).toHaveBeenCalledWith("user_1");
    expect(mockSendEmail.mock.calls[0][0].text).toContain("ada@example.com");
    expect(mockSendEmail.mock.calls[0][0].text).not.toContain("attacker");
  });

  // The email is the whole request here, so a failed send must be reported
  it("returns 500 when the email fails", async () => {
    mockSendEmail.mockRejectedValueOnce(emailFailure);

    expect((await call(exportData, "POST")).status).toBe(500);
  });

  it("returns 422 when the account has no email", async () => {
    mockGetUser.mockResolvedValueOnce({
      primaryEmailAddressId: null,
      emailAddresses: [],
    });

    const response = await call(exportData, "POST");

    expect(response.status).toBe(422);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
