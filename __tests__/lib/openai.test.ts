import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  callOpenAI,
  callOpenAIStructured,
  formatPromptFacts,
} from "@/lib/openai";

const mockFetch = jest.fn<(...args: any[]) => Promise<any>>();
const completion = (content: unknown) => ({
  ok: true,
  json: async () => ({ choices: [{ message: { content } }] }),
});
const apiError = (status: number, text: string) => ({
  ok: false,
  status,
  text: async () => text,
});
const sentBody = (call = 0) => JSON.parse(mockFetch.mock.calls[call][1].body);

describe("formatPromptFacts", () => {
  it("leaves out blank fields", () => {
    const facts = formatPromptFacts({
      Name: "Robotics",
      School: null,
      City: undefined,
      Notes: "   ",
      Tags: [],
    });

    expect(facts).toBe("Name: Robotics");
  });

  it("keeps false and zero, which are real answers", () => {
    expect(formatPromptFacts({ Leadership: false, Hours: 0 })).toBe(
      "Leadership: No\nHours: 0",
    );
  });

  it("writes dates as a calendar day", () => {
    expect(
      formatPromptFacts({ Deadline: new Date("2026-12-01T00:00:00Z") }),
    ).toBe("Deadline: 2026-12-01");
  });
});

describe("callOpenAI", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends the prompt to the default model and returns the trimmed reply", async () => {
    mockFetch.mockResolvedValueOnce(completion("  Hello  "));

    await expect(callOpenAI("Say hello")).resolves.toBe("Hello");
    expect(sentBody()).toEqual({
      model: "gpt-6-luna",
      messages: [{ role: "user", content: "Say hello" }],
    });
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-key",
    );
  });

  it("throws before calling the API when the key is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(callOpenAI("Say hello")).rejects.toThrow(
      "OPENAI_API_KEY is not configured",
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("asks for strict structured output when a schema is given", async () => {
    mockFetch.mockResolvedValueOnce(completion("{}"));
    const schema = { name: "reply", schema: { type: "object" } };

    await callOpenAI("Say hello", undefined, undefined, schema);

    expect(sentBody().response_format).toEqual({
      type: "json_schema",
      json_schema: { ...schema, strict: true },
    });
  });

  it("retries with max_tokens when max_completion_tokens is rejected", async () => {
    mockFetch
      .mockResolvedValueOnce(
        apiError(400, "Unsupported parameter: max_completion_tokens"),
      )
      .mockResolvedValueOnce(completion("Hello"));

    await expect(callOpenAI("Say hello", "some-model", 50)).resolves.toBe(
      "Hello",
    );
    expect(sentBody(0).max_completion_tokens).toBe(50);
    expect(sentBody(1).max_tokens).toBe(50);
    expect(sentBody(1).max_completion_tokens).toBeUndefined();
  });

  it("throws on any other API error", async () => {
    mockFetch.mockResolvedValueOnce(apiError(429, "Rate limit reached"));

    await expect(callOpenAI("Say hello")).rejects.toThrow(
      "OpenAI API error (429): Rate limit reached",
    );
  });

  it("joins a reply that arrives as content parts", async () => {
    mockFetch.mockResolvedValueOnce(
      completion([{ text: "Hello " }, { text: "there" }]),
    );

    await expect(callOpenAI("Say hello")).resolves.toBe("Hello there");
  });

  it("throws when the reply is empty", async () => {
    mockFetch.mockResolvedValueOnce(completion(null));

    await expect(callOpenAI("Say hello")).rejects.toThrow(
      "No content in OpenAI response",
    );
  });
});

describe("callOpenAIStructured", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    process.env.OPENAI_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns the parsed JSON reply", async () => {
    mockFetch.mockResolvedValueOnce(completion('{"reasons":["a","b","c"]}'));

    await expect(
      callOpenAIStructured("Give reasons", {
        name: "reasons",
        schema: { type: "object" },
      }),
    ).resolves.toEqual({ reasons: ["a", "b", "c"] });
  });
});
