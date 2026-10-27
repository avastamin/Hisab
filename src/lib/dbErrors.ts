/**
 * Turns a Supabase/Postgres error into something a person can act on. Foreign-key violations (23503) mean the row
 * is still used elsewhere, which is the only failure a normal user can trigger on purpose.
 */
export function friendlyDbError(error: { code?: string; message: string }, what: string): string {
  if (error.code === "23503") return `Couldn't ${what}: it's still used by other entries.`;
  // PostgREST can't find a column the app writes: the database is behind the code.
  if (error.code === "PGRST204") return `Couldn't ${what}: the database needs the latest update from supabase/migrations.`;
  if (error.code === "23505") return `Couldn't ${what}: one with that name already exists.`;
  return `Couldn't ${what}. Please try again. (${error.message})`;
}
