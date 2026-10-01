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
  type text not null check (type in ('crop_cycle', 'vehicle', 'person', 'general')),
  crop_cycle_id uuid references crop_cycles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

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

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'crops', 'crop_cycles', 'categories', 'tags', 'cost_centers', 'workers',
    'expense_entries', 'labor_entries', 'sale_entries'
  ])
  loop
    execute format(
      'create policy "owner_select_%1$s" on %1$s for select using (auth.uid() = user_id);', t
    );
    execute format(
      'create policy "owner_insert_%1$s" on %1$s for insert with check (auth.uid() = user_id);', t
    );
    execute format(
      'create policy "owner_update_%1$s" on %1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t
    );
    execute format(
      'create policy "owner_delete_%1$s" on %1$s for delete using (auth.uid() = user_id);', t
    );
  end loop;
end $$;

create policy "owner_select_budget_settings" on budget_settings for select using (auth.uid() = user_id);
create policy "owner_insert_budget_settings" on budget_settings for insert with check (auth.uid() = user_id);
create policy "owner_update_budget_settings" on budget_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed sensible defaults for a brand-new user (built-in categories), the same
-- ones the mobile app ships with, so the household screens aren't empty on day one.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into categories (user_id, name, kind, is_built_in) values
    (new.id, 'Fertilizer', 'cost', true),
    (new.id, 'Seeds', 'cost', true),
    (new.id, 'Labor', 'cost', true),
    (new.id, 'Pesticide', 'cost', true),
    (new.id, 'Irrigation', 'cost', true),
    (new.id, 'Equipment', 'cost', true),
    (new.id, 'Transport', 'cost', true),
    (new.id, 'Groceries', 'cost', true),
    (new.id, 'Medicine', 'cost', true),
    (new.id, 'Education', 'cost', true),
    (new.id, 'Fuel', 'cost', true),
    (new.id, 'Other', 'cost', true),
    (new.id, 'Harvest Sale', 'revenue', true),
    (new.id, 'Other Income', 'revenue', true);

  insert into cost_centers (user_id, type, name) values
    (new.id, 'general', 'General household');

  insert into budget_settings (user_id, enabled, monthly_amount) values (new.id, false, 0);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
