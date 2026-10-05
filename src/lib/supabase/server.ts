import { createServerClient } from "@supabase/ssr";
import { createResilientFetch } from "./resilientFetch";
import { cookies } from "next/headers";

// One per module: it holds no per-request state.
const resilientFetch = createResilientFetch();

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Must be created fresh per request (never cached in a module-level variable).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: resilientFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — safe to ignore since `proxy.ts`
            // refreshes the session on every request.
          }
        },
      },
    },
  );
}
