import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { sql } from "@/lib/db";

const mockQuery = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("@neondatabase/serverless", () => ({
  neon:
    () =>
    (...args: any[]) =>
      mockQuery(...args),
}));

// Shaped like the driver's NeonDbError: the detail is only in the message
const neonError = (message: string) =>
  Object.assign(new Error(message), { name: "NeonDbError" });

const runQuery = async () => {
  const result = sql`SELECT 1`;
  // Lets a rejection be asserted after the timers have been advanced
  result.catch(() => undefined);
  await jest.runAllTimersAsync();
  return result;
};

describe("sql", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockQuery.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the rows when the query succeeds", async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1 }]);

    await expect(runQuery()).resolves.toEqual([{ id: 1 }]);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it.each([
    "Server error (HTTP status 502): bad gateway",
    "Server error (HTTP status 503): no healthy upstream",
    "Server error (HTTP status 504): gateway timeout",
    "Error connecting to database: TypeError: fetch failed",
  ])("retries after %p", async (message) => {
    mockQuery
      .mockRejectedValueOnce(neonError(message))
      .mockResolvedValueOnce([{ id: 1 }]);

    await expect(runQuery()).resolves.toEqual([{ id: 1 }]);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("gives up after two retries", async () => {
    const error = neonError("Server error (HTTP status 503): still down");
    mockQuery.mockRejectedValue(error);

    await expect(runQuery()).rejects.toBe(error);
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it("does not retry a query error", async () => {
    const error = neonError('relation "missing_table" does not exist');
    mockQuery.mockRejectedValue(error);

    await expect(runQuery()).rejects.toBe(error);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
