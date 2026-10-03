"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/format";
import { round2 } from "@/domain/money";

// Shows `a × b` for two number inputs of the surrounding form (quantity × unit price, days × daily rate), updating
// as the user types. Reads the inputs by name, so the form itself can stay a Server Component.
export function LiveTotal({ a, b }: { a: string; b: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const value = (name: string) => Number((form.elements.namedItem(name) as HTMLInputElement | null)?.value) || 0;
    const update = () => setTotal(round2(value(a) * value(b)));
    update();
    form.addEventListener("input", update);
    return () => form.removeEventListener("input", update);
  }, [a, b]);

  return (
    <p ref={ref} className="-mt-2 text-sm text-text-secondary">
      Total: <span className="font-semibold text-text-primary">{formatMoney(total)}</span>
    </p>
  );
}
