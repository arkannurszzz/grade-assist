class RateLimiter {
  private activeRequests = 0;
  private requestTimestamps: number[] = [];
  private maxRPM: number;
  private maxConcurrent: number;

  constructor(maxRPM: number = 10, maxConcurrent: number = 2) {
    this.maxRPM = maxRPM;
    this.maxConcurrent = maxConcurrent;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(
          (t) => now - t < 60_000
        );

        if (
          this.activeRequests < this.maxConcurrent &&
          this.requestTimestamps.length < this.maxRPM
        ) {
          this.activeRequests++;
          this.requestTimestamps.push(now);
          resolve();
        } else {
          const waitTime =
            this.requestTimestamps.length >= this.maxRPM
              ? 60_000 - (now - this.requestTimestamps[0]) + 100
              : 500;
          setTimeout(tryAcquire, Math.max(waitTime, 500));
        }
      };
      tryAcquire();
    });
  }

  release(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }
}

export const rateLimiter = new RateLimiter(10, 2);

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[withRetry] Attempt ${attempt + 1}/${maxRetries + 1}`);
      return await fn();
    } catch (error: unknown) {
      console.error(`[withRetry] Attempt ${attempt + 1} failed:`, error);

      const status = (error as { status?: number }).status;
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error(`[withRetry] Error status: ${status}`);
      console.error(`[withRetry] Error message: ${errorMsg}`);

      if (status === 429 && attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 10_000;
        console.warn(`[withRetry] Rate limited (429). Waiting ${waitTime / 1000}s before retry ${attempt + 2}...`);
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }

      console.error(`[withRetry] Giving up after ${attempt + 1} attempts`);
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
