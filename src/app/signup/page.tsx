import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { signUp } from "@/lib/actions/auth";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/icons/icon-192.png" alt="Hisab" width={64} height={64} className="rounded-2xl" />
          <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
          <p className="text-center text-sm text-text-secondary">Your data is private to you, protected by your login.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <AuthForm action={signUp} submitLabel="Sign up" pendingLabel="Creating account…" />
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
