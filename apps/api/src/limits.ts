/** Security limits of the API (PLAN.md §8 Sécurité). */
export const LIMITS = {
  /** Largest accepted request body, in bytes. */
  bodyBytes: 64 * 1024,
  /** Requests per address and per minute, on every route except /health. */
  requestsPerMinute: 120,
  /** Largest accepted Socket.IO message, in bytes. */
  socketMessageBytes: 64 * 1024,
  /** Socket.IO messages per connection: at most `max` per `windowMs`. */
  socketMessages: { max: 30, windowMs: 10_000 },
} as const;

/**
 * Counts the messages of one connection over a sliding window.
 * Returns false once the connection sends more than `max` messages in `windowMs`.
 */
export function createMessageLimiter({ max, windowMs }: { max: number; windowMs: number }) {
  const times: number[] = [];
  return (now: number): boolean => {
    while (times.length > 0 && now - (times[0] as number) >= windowMs) times.shift();
    if (times.length >= max) return false;
    times.push(now);
    return true;
  };
}
