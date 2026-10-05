// Shared by the server-side flash() helper and the client-side <Toaster>: a toast travels from a Server Action to
// the browser as a short-lived cookie, so it survives the redirect most actions end with.

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export const TOAST_COOKIE = "hisab_toast";

const TYPES: readonly ToastType[] = ["success", "error", "warning", "info"];

export function encodeToast(toast: ToastMessage): string {
  return encodeURIComponent(JSON.stringify(toast));
}

/** Returns null for anything that isn't a well-formed toast, so a mangled cookie is ignored rather than shown. */
export function decodeToast(value: string | undefined): ToastMessage | null {
  if (!value) return null;
  try {
    // The cookie layer may or may not have percent-encoded it once more on the way, so decode one step at a time
    // until it parses. (Not "until no % is left": the message itself may contain one, e.g. "50% off".)
    let text = value;
    let parsed: unknown = undefined;
    for (let i = 0; i < 3 && parsed === undefined; i++) {
      text = decodeURIComponent(text);
      try {
        parsed = JSON.parse(text);
      } catch {
        // not JSON yet: decode again
      }
    }
    if (typeof parsed !== "object" || parsed === null) return null;
    const { id, type, message } = parsed as Record<string, unknown>;
    if (typeof id !== "string" || typeof message !== "string" || !TYPES.includes(type as ToastType)) return null;
    return { id, type: type as ToastType, message };
  } catch {
    return null;
  }
}
