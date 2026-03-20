/**
 * Simple concurrency limiter (semaphore) for controlling
 * how many analysis requests hit the OpenAI API simultaneously.
 *
 * No external dependencies — pure Promise-based queue.
 */

const MAX_CONCURRENT = 15;

let running = 0;
const queue: Array<() => void> = [];

export async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  // Wait for a slot if at capacity
  if (running >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => {
      queue.push(resolve);
    });
  }

  running++;
  try {
    return await fn();
  } finally {
    running--;
    // Release next queued request
    if (queue.length > 0) {
      const next = queue.shift()!;
      next();
    }
  }
}
