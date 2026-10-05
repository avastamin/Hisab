import { cookies } from "next/headers";
import { TOAST_COOKIE, encodeToast, type ToastType } from "./toast";

/** Queues a toast for the browser from a Server Action. Shown by <Toaster> once the action's response arrives. */
export async function flash(type: ToastType, message: string) {
  (await cookies()).set(TOAST_COOKIE, encodeToast({ id: crypto.randomUUID(), type, message }), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
}
