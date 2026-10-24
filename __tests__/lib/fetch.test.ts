import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  deleteResponseCache,
  deleteResponseCacheByPrefix,
  fetchAPI,
  fetchCachedAPI,
  REQUEST_TIMEOUT_MS,
} from "@/lib/fetch";

const mockFetch = jest.fn<(...args: any[]) => Promise<any>>();
const jsonReply = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("fetch helpers", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    deleteResponseCacheByPrefix("");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("fetchAPI", () => {
    it("returns the parsed body", async () => {
      mockFetch.mockResolvedValueOnce(jsonReply({ data: [1] }));

      await expect(fetchAPI("https://api.test/items")).resolves.toEqual({
        data: [1],
      });
    });

    it("throws on an error status", async () => {
      mockFetch.mockResolvedValueOnce(jsonReply({}, 500));

      await expect(fetchAPI("https://api.test/items")).rejects.toThrow(
        "HTTP error! status: 500",
      );
    });

    it("gives up on a request that never answers", async () => {
      jest.useFakeTimers();
      // Settles only when the timeout aborts it, like a stalled connection
      mockFetch.mockImplementationOnce(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener("abort", () =>
              reject(new Error("Aborted")),
            );
          }),
      );

      const request = fetchAPI("https://api.test/slow");
      jest.advanceTimersByTime(REQUEST_TIMEOUT_MS);

      await expect(request).rejects.toThrow(
        "Request timed out: https://api.test/slow",
      );
      jest.useRealTimers();
    });

    it("lets a cached request be retried after it times out", async () => {
      jest.useFakeTimers();
      mockFetch.mockImplementationOnce(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener("abort", () =>
              reject(new Error("Aborted")),
            );
          }),
      );

      const stalled = fetchCachedAPI("slow", 60_000, "https://api.test/slow");
      jest.advanceTimersByTime(REQUEST_TIMEOUT_MS);
      await expect(stalled).rejects.toThrow("Request timed out");
      jest.useRealTimers();

      mockFetch.mockResolvedValueOnce(jsonReply({ data: "fresh" }));
      await expect(
        fetchCachedAPI("slow", 60_000, "https://api.test/slow"),
      ).resolves.toEqual({ data: "fresh" });
    });
  });

  describe("fetchCachedAPI", () => {
    it("reuses a response inside its TTL", async () => {
      mockFetch.mockResolvedValue(jsonReply({ data: "first" }));

      await fetchCachedAPI("items", 60_000, "https://api.test/items");
      const second = await fetchCachedAPI(
        "items",
        60_000,
        "https://api.test/items",
      );

      expect(second).toEqual({ data: "first" });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("fetches again once the TTL has passed", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(1_000);
      mockFetch
        .mockResolvedValueOnce(jsonReply({ data: "first" }))
        .mockResolvedValueOnce(jsonReply({ data: "second" }));

      await fetchCachedAPI("items", 60_000, "https://api.test/items");
      now.mockReturnValue(62_000);

      await expect(
        fetchCachedAPI("items", 60_000, "https://api.test/items"),
      ).resolves.toEqual({ data: "second" });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("shares one request between concurrent callers", async () => {
      mockFetch.mockResolvedValue(jsonReply({ data: "shared" }));

      const results = await Promise.all([
        fetchCachedAPI("items", 60_000, "https://api.test/items"),
        fetchCachedAPI("items", 60_000, "https://api.test/items"),
      ]);

      expect(results).toEqual([{ data: "shared" }, { data: "shared" }]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not cache a failed request", async () => {
      mockFetch
        .mockResolvedValueOnce(jsonReply({}, 500))
        .mockResolvedValueOnce(jsonReply({ data: "recovered" }));

      await expect(
        fetchCachedAPI("items", 60_000, "https://api.test/items"),
      ).rejects.toThrow("HTTP error! status: 500");
      await expect(
        fetchCachedAPI("items", 60_000, "https://api.test/items"),
      ).resolves.toEqual({ data: "recovered" });
    });

    it("fetches again after a key is deleted", async () => {
      mockFetch.mockResolvedValue(jsonReply({ data: "value" }));

      await fetchCachedAPI("items", 60_000, "https://api.test/items");
      deleteResponseCache("items");
      await fetchCachedAPI("items", 60_000, "https://api.test/items");

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("deletes every key that starts with a prefix", async () => {
      mockFetch.mockResolvedValue(jsonReply({ data: "value" }));

      await fetchCachedAPI("logs:1", 60_000, "https://api.test/logs/1");
      await fetchCachedAPI("logs:2", 60_000, "https://api.test/logs/2");
      await fetchCachedAPI("activities", 60_000, "https://api.test/activities");
      deleteResponseCacheByPrefix("logs:");

      await fetchCachedAPI("logs:1", 60_000, "https://api.test/logs/1");
      await fetchCachedAPI("logs:2", 60_000, "https://api.test/logs/2");
      await fetchCachedAPI("activities", 60_000, "https://api.test/activities");

      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });
});
