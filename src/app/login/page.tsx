import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/icons/icon-192.png" alt="Hisab" width={64} height={64} className="rounded-2xl" />
          <h1 className="text-2xl font-bold text-text-primary">Hisab</h1>
          <p className="text-center text-sm text-text-secondary">Track household and farm money, from any device.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <AuthForm action={signIn} submitLabel="Log in" pendingLabel="Logging in…" />
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
