/**
 * fetch for the Supabase clients that gives up on a stalled request and tries again. Some connections to Supabase
 * occasionally hang for a minute or more instead of failing (seen from a home connection: about 1 request in 13),
 * and a page makes around ten requests, so one stall would otherwise hold the whole page up.
 *
 * Only reads (GET/HEAD) are retried: retrying a write that the server already applied could, for example, insert
 * the same expense twice. Writes still get the time limit, so a stalled save fails with an error toast instead of
 * hanging.
 */
export function createResilientFetch({
  timeoutMs = 4000,
  writeTimeoutMs = 20000,
  retries = 2,
  baseFetch = fetch,
}: { timeoutMs?: number; writeTimeoutMs?: number; retries?: number; baseFetch?: typeof fetch } = {}): typeof fetch {
  return async (input, init) => {
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const isRead = method === "GET" || method === "HEAD";
    const attempts = isRead ? retries + 1 : 1;

    for (let attempt = 1; ; attempt++) {
      const controller = new AbortController();
      const callerSignal = init?.signal;
      const onCallerAbort = () => controller.abort(callerSignal?.reason);
      callerSignal?.addEventListener("abort", onCallerAbort);
      const timer = setTimeout(() => controller.abort(new Error("timeout")), isRead ? timeoutMs : writeTimeoutMs);
      try {
        return await baseFetch(input, { ...init, signal: controller.signal });
      } catch (error) {
        // Stop if the caller cancelled, the request wasn't a timeout we caused, or we're out of attempts.
        const timedOut = controller.signal.aborted && !callerSignal?.aborted;
        if (!timedOut || attempt >= attempts) throw error;
      } finally {
        clearTimeout(timer);
        callerSignal?.removeEventListener("abort", onCallerAbort);
      }
    }
  };
}
