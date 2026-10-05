"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import clsx from "clsx";
import { TOAST_COOKIE, decodeToast, type ToastMessage, type ToastType } from "@/lib/toast";

const TOAST_EVENT = "hisab:toast";

/** Shows a toast from client code (e.g. a cancelled confirmation). Server Actions use flash() instead. */
export function showToast(type: ToastType, message: string) {
  window.dispatchEvent(new CustomEvent<ToastMessage>(TOAST_EVENT, { detail: { id: crypto.randomUUID(), type, message } }));
}

const STYLES: Record<ToastType, { icon: typeof Info; className: string; duration: number }> = {
  success: { icon: CheckCircle2, className: "border-positive text-positive", duration: 3500 },
  info: { icon: Info, className: "border-primary text-primary", duration: 3500 },
  warning: { icon: AlertTriangle, className: "border-warning text-warning", duration: 5000 },
  error: { icon: XCircle, className: "border-negative text-negative", duration: 7000 },
};

/** Reads and clears the flash cookie a Server Action may have set. */
function takeFlashCookie(): ToastMessage | null {
  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TOAST_COOKIE}=`))
    ?.slice(TOAST_COOKIE.length + 1);
  if (raw === undefined) return null;
  document.cookie = `${TOAST_COOKIE}=; path=/; max-age=0; samesite=lax`;
  return decodeToast(raw);
}

/**
 * Displays toasts queued by Server Actions (via a cookie) or by showToast(). The cookie is checked on every
 * navigation and, because many actions only revalidate without navigating, for a short while after any form
 * submission until the action's response (and its cookie) has arrived.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const seen = useRef(new Set<string>());
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dismiss = useCallback((id: string) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (toast: ToastMessage) => {
      if (seen.current.has(toast.id)) return;
      seen.current.add(toast.id);
      setToasts((all) => [...all.slice(-2), toast]);
      window.setTimeout(() => dismiss(toast.id), STYLES[toast.type].duration);
    },
    [dismiss],
  );

  const checkCookie = useCallback(() => {
    const toast = takeFlashCookie();
    if (toast) push(toast);
    return toast !== null;
  }, [push]);

  // After a navigation (including the redirect most actions end with).
  useEffect(() => {
    checkCookie();
  }, [pathname, searchParams, checkCookie]);

  // After a form submission that doesn't navigate: poll briefly for the action's cookie.
  useEffect(() => {
    let timer: number | undefined;
    const onSubmit = () => {
      window.clearInterval(timer);
      const started = Date.now();
      timer = window.setInterval(() => {
        if (checkCookie() || Date.now() - started > 15000) window.clearInterval(timer);
      }, 200);
    };
    const onToast = (e: Event) => push((e as CustomEvent<ToastMessage>).detail);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener(TOAST_EVENT, onToast);
    };
  }, [checkCookie, push]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4"
    >
      {toasts.map((t) => {
        const { icon: Icon, className } = STYLES[t.type];
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            data-toast-type={t.type}
            className={clsx(
              "pointer-events-auto flex items-start gap-2 rounded-xl border bg-surface px-3 py-2.5 text-sm shadow-lg",
              className,
            )}
          >
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
            <p className="flex-1 text-text-primary">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="shrink-0 text-text-secondary">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
