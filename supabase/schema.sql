-- Hisab web app schema.
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query -> paste -> Run).
-- Mirrors the domain model in src/domain/types.ts, with one addition: every table carries a
-- user_id column and a row-level-security policy so each signed-in user only ever sees their
-- own data, since this database is now reachable from the internet (unlike the offline mobile app).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists crops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists crop_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  crop_id uuid not null references crops (id) on delete cascade,
  label text not null,
  plot_or_area text,
  status text not null check (status in ('planned', 'growing', 'harvested', 'closed')),
  start_date date not null,
  planned_harvest_date date,
  closed_date date,
  expected_yield numeric,
  yield_unit text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('cost', 'revenue')),
  color text,
  is_built_in boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists cost_centers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('crop_cycle', 'vehicle', 'person', 'general', 'farm')),
  crop_cycle_id uuid references crop_cycles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Widen the type check for a database that already had this table from before
-- "farm" existed (create table if not exists above is a no-op there, since
-- the table already exists, so the old constraint has to be swapped in place).
alter table cost_centers drop constraint if exists cost_centers_type_check;
alter table cost_centers add constraint cost_centers_type_check
  check (type in ('crop_cycle', 'vehicle', 'person', 'general', 'farm'));

create table if not exists workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  default_daily_rate numeric,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists expense_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  cost_center_id uuid not null references cost_centers (id) on delete cascade,
  category_id uuid not null references categories (id) on delete restrict,
  tag_ids uuid[] not null default '{}',
  note text,
  amount numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists labor_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  cost_center_id uuid not null references cost_centers (id) on delete cascade,
  category_id uuid not null references categories (id) on delete restrict,
  tag_ids uuid[] not null default '{}',
  note text,
  worker_id uuid not null references workers (id) on delete restrict,
  days_worked numeric not null,
  daily_rate numeric not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists sale_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  crop_cycle_id uuid not null references crop_cycles (id) on delete cascade,
  category_id uuid not null references categories (id) on delete restrict,
  tag_ids uuid[] not null default '{}',
  buyer text,
  quantity numeric not null,
  unit text not null,
  unit_price numeric not null,
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- Singleton-per-user row, same idea as the mobile app's budget_settings table.
create table if not exists budget_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  monthly_amount numeric not null default 0
);

-- ---------------------------------------------------------------------------
-- Helpful indexes for the queries the dashboard/reports run most.
-- ---------------------------------------------------------------------------

create index if not exists idx_crop_cycles_user on crop_cycles (user_id);
create index if not exists idx_cost_centers_user on cost_centers (user_id);
create index if not exists idx_expense_entries_user_date on expense_entries (user_id, date);
create index if not exists idx_labor_entries_user_date on labor_entries (user_id, date);
create index if not exists idx_sale_entries_user_date on sale_entries (user_id, date);

-- ---------------------------------------------------------------------------
-- Row Level Security: every table is only readable/writable by its owner.
-- ---------------------------------------------------------------------------

alter table crops enable row level security;
alter table crop_cycles enable row level security;
alter table categories enable row level security;
alter table tags enable row level security;
alter table cost_centers enable row level security;
alter table workers enable row level security;
alter table expense_entries enable row level security;
alter table labor_entries enable row level security;
alter table sale_entries enable row level security;
alter table budget_settings enable row level security;

-- Each policy is dropped first so this whole script can be re-run on a
-- database that already has it applied (e.g. to pick up a schema update)
-- without erroring on "policy already exists".
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'crops', 'crop_cycles', 'categories', 'tags', 'cost_centers', 'workers',
    'expense_entries', 'labor_entries', 'sale_entries'
  ])
  loop
    execute format('drop policy if exists "owner_select_%1$s" on %1$s;', t);
    execute format(
      'create policy "owner_select_%1$s" on %1$s for select using (auth.uid() = user_id);', t
    );
    execute format('drop policy if exists "owner_insert_%1$s" on %1$s;', t);
    execute format(
      'create policy "owner_insert_%1$s" on %1$s for insert with check (auth.uid() = user_id);', t
    );
    execute format('drop policy if exists "owner_update_%1$s" on %1$s;', t);
    execute format(
      'create policy "owner_update_%1$s" on %1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t
    );
    execute format('drop policy if exists "owner_delete_%1$s" on %1$s;', t);
    execute format(
      'create policy "owner_delete_%1$s" on %1$s for delete using (auth.uid() = user_id);', t
    );
  end loop;
end $$;

drop policy if exists "owner_select_budget_settings" on budget_settings;
create policy "owner_select_budget_settings" on budget_settings for select using (auth.uid() = user_id);
drop policy if exists "owner_insert_budget_settings" on budget_settings;
create policy "owner_insert_budget_settings" on budget_settings for insert with check (auth.uid() = user_id);
drop policy if exists "owner_update_budget_settings" on budget_settings;
create policy "owner_update_budget_settings" on budget_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed sensible defaults for a brand-new user (built-in categories and tags),
-- covering both farm/Agro and household/Family use, so the screens aren't
-- empty on day one.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into categories (user_id, name, kind, is_built_in) values
    -- Agro / farm
    (new.id, 'Organic Fertilizer', 'cost', true),
    (new.id, 'Chemical Fertilizer', 'cost', true),
    (new.id, 'Fertilizer', 'cost', true),
    (new.id, 'Seeds', 'cost', true),
    (new.id, 'Pesticide', 'cost', true),
    (new.id, 'Herbicide', 'cost', true),
    (new.id, 'Fungicide', 'cost', true),
    (new.id, 'Labour', 'cost', true),
    (new.id, 'Irrigation', 'cost', true),
    (new.id, 'Equipment', 'cost', true),
    (new.id, 'Land Rent', 'cost', true),
    (new.id, 'Nursery / Saplings', 'cost', true),
    (new.id, 'Transport', 'cost', true),
    -- Family / household
    (new.id, 'Groceries', 'cost', true),
    (new.id, 'Fish', 'cost', true),
    (new.id, 'Meat', 'cost', true),
    (new.id, 'Vegetables', 'cost', true),
    (new.id, 'Dairy & Eggs', 'cost', true),
    (new.id, 'Processed Foods', 'cost', true),
    (new.id, 'Medicine', 'cost', true),
    (new.id, 'Education', 'cost', true),
    (new.id, 'Fuel', 'cost', true),
    (new.id, 'Utilities', 'cost', true),
    (new.id, 'House Rent', 'cost', true),
    (new.id, 'Clothing', 'cost', true),
    (new.id, 'Other', 'cost', true),
    -- Revenue
    (new.id, 'Harvest Sale', 'revenue', true),
    (new.id, 'Other Income', 'revenue', true);

  insert into tags (user_id, name) values
    (new.id, 'Organic'),
    (new.id, 'Chemical / Synthetic'),
    (new.id, 'Wholesale'),
    (new.id, 'Bulk Purchase'),
    (new.id, 'Emergency / Urgent'),
    (new.id, 'Discount / Sale'),
    (new.id, 'Festival / Eid'),
    (new.id, 'Online Order');

  insert into cost_centers (user_id, type, name) values
    (new.id, 'general', 'General household'),
    (new.id, 'farm', 'General farm');

  insert into budget_settings (user_id, enabled, monthly_amount) values (new.id, false, 0);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Backfill: the trigger above only fires for NEW signups (it listens for
-- INSERTs on auth.users), so an account created before this seed list existed
-- - or before schema.sql was first run at all - never got any categories,
-- tags, cost center, or budget row. This section is safe to re-run any
-- number of times: it only inserts a given default for a user who doesn't
-- already have one with that exact name (or, for budget_settings, one at
-- all), so it will never duplicate rows or touch anything you've already
-- added or renamed yourself.
-- ---------------------------------------------------------------------------

-- Spelling fix: the built-in "Labor" category is now "Labour". Rename it in place (before the backfill below,
-- so the backfill doesn't add a second "Labour" next to the old one); existing entries keep pointing at it.
update categories c
set name = 'Labour'
where c.name = 'Labor' and c.is_built_in
  and not exists (select 1 from categories other where other.user_id = c.user_id and other.name = 'Labour');

insert into categories (user_id, name, kind, is_built_in)
select u.id, d.name, d.kind, true
from auth.users u
cross join (values
  ('Organic Fertilizer', 'cost'),
  ('Chemical Fertilizer', 'cost'),
  ('Fertilizer', 'cost'),
  ('Seeds', 'cost'),
  ('Pesticide', 'cost'),
  ('Herbicide', 'cost'),
  ('Fungicide', 'cost'),
  ('Labour', 'cost'),
  ('Irrigation', 'cost'),
  ('Equipment', 'cost'),
  ('Land Rent', 'cost'),
  ('Nursery / Saplings', 'cost'),
  ('Transport', 'cost'),
  ('Groceries', 'cost'),
  ('Fish', 'cost'),
  ('Meat', 'cost'),
  ('Vegetables', 'cost'),
  ('Dairy & Eggs', 'cost'),
  ('Processed Foods', 'cost'),
  ('Medicine', 'cost'),
  ('Education', 'cost'),
  ('Fuel', 'cost'),
  ('Utilities', 'cost'),
  ('House Rent', 'cost'),
  ('Clothing', 'cost'),
  ('Other', 'cost'),
  ('Harvest Sale', 'revenue'),
  ('Other Income', 'revenue')
) as d(name, kind)
where not exists (
  select 1 from categories existing
  where existing.user_id = u.id and existing.name = d.name
);

insert into tags (user_id, name)
select u.id, d.name
from auth.users u
cross join (values
  ('Organic'),
  ('Chemical / Synthetic'),
  ('Wholesale'),
  ('Bulk Purchase'),
  ('Emergency / Urgent'),
  ('Discount / Sale'),
  ('Festival / Eid'),
  ('Online Order')
) as d(name)
where not exists (
  select 1 from tags existing
  where existing.user_id = u.id and existing.name = d.name
);

insert into cost_centers (user_id, type, name)
select u.id, 'general', 'General household'
from auth.users u
where not exists (
  select 1 from cost_centers existing
  where existing.user_id = u.id and existing.type = 'general'
);

insert into cost_centers (user_id, type, name)
select u.id, 'farm', 'General farm'
from auth.users u
where not exists (
  select 1 from cost_centers existing
  where existing.user_id = u.id and existing.type = 'farm'
);

insert into budget_settings (user_id, enabled, monthly_amount)
select u.id, false, 0
from auth.users u
on conflict (user_id) do nothing;
