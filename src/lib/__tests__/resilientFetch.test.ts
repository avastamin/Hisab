import { createResilientFetch } from "../supabase/resilientFetch";

/** A fake fetch whose calls hang (until aborted) or answer, in the given order. */
function scriptedFetch(script: ("hang" | "ok" | "fail")[]) {
  const calls: string[] = [];
  const fake = ((_input: RequestInfo | URL, init?: RequestInit) => {
    const step = script[calls.length] ?? "ok";
    calls.push(`${init?.method ?? "GET"}:${step}`);
    if (step === "ok") return Promise.resolve(new Response("ok"));
    if (step === "fail") return Promise.reject(new TypeError("network down"));
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  }) as typeof fetch;
  return { fake, calls };
}

describe("createResilientFetch", () => {
  it("retries a stalled read and returns the retry's answer", async () => {
    const { fake, calls } = scriptedFetch(["hang", "ok"]);
    const res = await createResilientFetch({ timeoutMs: 20, baseFetch: fake })("https://x/rest", { method: "GET" });
    expect(await res.text()).toBe("ok");
    expect(calls).toEqual(["GET:hang", "GET:ok"]);
  });

  it("gives up after the last retry", async () => {
    const { fake, calls } = scriptedFetch(["hang", "hang", "hang"]);
    await expect(createResilientFetch({ timeoutMs: 10, retries: 2, baseFetch: fake })("https://x")).rejects.toThrow();
    expect(calls).toHaveLength(3);
  });

  it("never retries a write, so a save can't be applied twice", async () => {
    const { fake, calls } = scriptedFetch(["hang", "ok"]);
    await expect(
      createResilientFetch({ writeTimeoutMs: 10, baseFetch: fake })("https://x/rest", { method: "POST", body: "{}" }),
    ).rejects.toThrow();
    expect(calls).toEqual(["POST:hang"]);
  });

  it("doesn't retry real network errors", async () => {
    const { fake, calls } = scriptedFetch(["fail", "ok"]);
    await expect(createResilientFetch({ baseFetch: fake })("https://x")).rejects.toThrow("network down");
    expect(calls).toHaveLength(1);
  });

  it("respects the caller cancelling", async () => {
    const { fake, calls } = scriptedFetch(["hang", "ok"]);
    const controller = new AbortController();
    const pending = createResilientFetch({ timeoutMs: 1000, baseFetch: fake })("https://x", { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });
});
