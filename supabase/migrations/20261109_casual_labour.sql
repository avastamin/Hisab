-- Casual (unsaved) workers on labour entries.
--
-- Run once in the Supabase SQL editor (Project -> SQL Editor -> New query -> paste -> Run). Safe to re-run.
-- schema.sql contains the same steps, so re-running the whole of schema.sql works too.
--
-- What it does to existing data:
--   * labor_entries.worker_id may now be empty: a labour entry for someone who isn't in Settings -> Workers, e.g.
--     a day labourer hired once. Existing entries keep their worker.
--   * adds labor_entries.worker_label: an optional name for that casual worker ("Rahim", "Helper 2"). Empty means
--     they're shown as "Casual worker".

begin;

alter table labor_entries alter column worker_id drop not null;
alter table labor_entries add column if not exists worker_label text;

commit;
