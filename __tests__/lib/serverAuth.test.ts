import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { requireAuth, unauthorizedResponse } from "@/lib/serverAuth";

const mockVerifyToken = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("@clerk/backend", () => ({
  verifyToken: (...args: any[]) => mockVerifyToken(...args),
}));

const requestWith = (authorization?: string) =>
  new Request("https://ec-ai.expo.app/getactivities", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });

describe("requireAuth", () => {
  beforeEach(() => {
    mockVerifyToken.mockReset();
    process.env.CLERK_SECRET_KEY = "sk_test_secret";
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the Clerk user id from a valid token", async () => {
    mockVerifyToken.mockResolvedValueOnce({ sub: "user_123" });

    await expect(requireAuth(requestWith("Bearer good-token"))).resolves.toBe(
      "user_123",
    );
    expect(mockVerifyToken).toHaveBeenCalledWith("good-token", {
      secretKey: "sk_test_secret",
    });
  });

  it.each([undefined, "Basic abc", "good-token"])(
    "rejects an Authorization header of %p",
    async (authorization) => {
      await expect(requireAuth(requestWith(authorization))).rejects.toThrow(
        "Unauthorized: missing Bearer token",
      );
    },
  );

  // The app sends these when it reads the token before Clerk has loaded
  it.each(["Bearer null", "Bearer undefined"])(
    "rejects %p without calling Clerk",
    async (authorization) => {
      await expect(requireAuth(requestWith(authorization))).rejects.toThrow(
        "Unauthorized: null token received from client",
      );
      expect(mockVerifyToken).not.toHaveBeenCalled();
    },
  );

  it("rejects every request when the secret key is not configured", async () => {
    delete process.env.CLERK_SECRET_KEY;

    await expect(requireAuth(requestWith("Bearer good-token"))).rejects.toThrow(
      "Unauthorized: server misconfiguration",
    );
  });

  it("hides the reason when Clerk rejects the token", async () => {
    mockVerifyToken.mockRejectedValueOnce(new Error("Token expired at 12:00"));

    await expect(requireAuth(requestWith("Bearer old-token"))).rejects.toThrow(
      /^Unauthorized$/,
    );
  });
});

describe("unauthorizedResponse", () => {
  it("is a 401 with a JSON error", async () => {
    const response = unauthorizedResponse();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});
