import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FROM_ADDRESS, sendEmail } from "@/lib/resend";

const mockSend = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("resend", () => ({
  Resend: class {
    emails = { send: (...args: any[]) => mockSend(...args) };
  },
}));

const email = {
  from: FROM_ADDRESS,
  to: "student@example.com",
  subject: "Your activities",
  text: "Attached.",
};

describe("sendEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("resolves when Resend accepts the email", async () => {
    mockSend.mockResolvedValueOnce({ data: { id: "email_1" }, error: null });

    await expect(sendEmail(email)).resolves.toBeUndefined();
    expect(mockSend).toHaveBeenCalledWith(email);
  });

  // Resend does not throw on a failed send, so this is the only signal
  it("throws when Resend returns an error", async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "Invalid `to` field" },
    });

    await expect(sendEmail(email)).rejects.toThrow(
      "Resend validation_error: Invalid `to` field",
    );
  });
});
