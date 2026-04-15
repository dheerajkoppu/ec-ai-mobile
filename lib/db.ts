import { neon } from "@neondatabase/serverless";

const baseSql = neon(process.env.DATABASE_URL!);
const RETRY_DELAYS_MS = [150, 400];

function isRetryableNeonError(error: unknown): boolean {
  const details = JSON.stringify(error ?? "").toLowerCase();

  return (
    details.includes("http status 502") ||
    details.includes("http status 503") ||
    details.includes("http status 504") ||
    details.includes("\"code\":502") ||
    details.includes("\"code\":503") ||
    details.includes("\"code\":504") ||
    details.includes("fetch failed") ||
    details.includes("socket hang up") ||
    details.includes("connection terminated")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<any> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await baseSql(strings, ...values);
    } catch (error) {
      lastError = error;

      if (
        attempt === RETRY_DELAYS_MS.length ||
        !isRetryableNeonError(error)
      ) {
        throw error;
      }

      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}
