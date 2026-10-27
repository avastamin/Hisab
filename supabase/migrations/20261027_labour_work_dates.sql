-- Labour work dates and worker colours.
--
-- Run once in the Supabase SQL editor (Project -> SQL Editor -> New query -> paste -> Run). Safe to re-run.
-- schema.sql contains the same steps, so re-running the whole of schema.sql works too.
--
-- What it does to existing data:
--   * adds labor_entries.work_dates: the days a worker worked, picked on the labour form's calendar. Existing
--     entries start with none (their "days worked" count is unchanged), so they don't show on the worker calendar
--     until you edit them and pick their days.
--   * adds workers.color: the colour a worker is shown in on calendars. Empty means one is picked automatically.

begin;

alter table labor_entries add column if not exists work_dates date[] not null default '{}';
alter table workers add column if not exists color text;

commit;
