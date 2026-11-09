"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * A modal on the native <dialog>, so Escape, focus trapping and stacking (a modal opened from another sits on top)
 * come from the browser. Shown while `open`; `onClose` (Escape, ✕ or a tap outside) must set `open` to false.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape. Not the dialog's close event, which also fires when `open` turns false, e.g. when one modal hands
      // over to another.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // The dialog element itself is only hit outside the panel, i.e. on the backdrop.
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-text-primary shadow-xl backdrop:bg-black/50"
    >
      {open ? (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-base font-semibold text-text-primary">
                {title}
              </h2>
              {subtitle ? <div className="text-xs text-text-secondary">{subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 rounded-full p-1 text-text-secondary hover:bg-surface-alt hover:text-text-primary"
            >
              <X size={20} />
            </button>
          </div>
          {children ? <div className="overflow-y-auto px-4 py-3">{children}</div> : null}
          {footer ? <div className="flex gap-2 border-t border-border px-4 py-3">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
