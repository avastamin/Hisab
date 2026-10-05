-- Agro / Household / Other categories, with tags under each.
--
-- Run once in the Supabase SQL editor (Project -> SQL Editor -> New query -> paste -> Run). It runs as one
-- transaction, so if anything fails nothing is changed. Safe to re-run. schema.sql contains the same steps, so
-- re-running the whole of schema.sql works too.
--
-- What it does to existing data:
--   * adds categories.category_group (agro | household | other) and fills it in for every cost tag
--   * renames "Labor" to "Labour" and "Equipment" to "Equipment / Tools"
--   * merges your own near-duplicates of a built-in tag (e.g. "Pesticides" into "Pesticide"), moving their entries
--   * adds the new default tags (Mobile / Internet, Loan Repayment, Zakat / Donation, ...) you don't already have
-- Entries themselves keep their amounts, dates and notes; labels (Organic, Wholesale, ...) are untouched.

begin;

alter table categories add column if not exists category_group text;
alter table categories drop constraint if exists categories_category_group_check;
alter table categories add constraint categories_category_group_check
  check (category_group is null or category_group in ('agro', 'household', 'other'));

-- Spelling fix: the built-in "Labor" category is now "Labour". Renamed in place, so existing entries keep pointing at it.
update categories c
set name = 'Labour'
where c.name = 'Labor' and c.is_built_in
  and not exists (select 1 from categories other where other.user_id = c.user_id and other.name = 'Labour');

-- Merge self-made near-duplicates of a built-in one (e.g. "Pesticides" next to built-in "Pesticide"): move their
-- entries over, then remove the duplicate. Only merges into built-ins, so two of your own are never merged.
drop table if exists category_merge;
create temp table category_merge as
select distinct on (dup.id) dup.id as dup_id, keep.id as keep_id
from categories dup
join categories keep
  on keep.user_id = dup.user_id and keep.kind = dup.kind and keep.is_built_in and not dup.is_built_in
 and regexp_replace(lower(trim(dup.name)), 's$', '') = regexp_replace(lower(trim(keep.name)), 's$', '');

update expense_entries e set category_id = m.keep_id from category_merge m where e.category_id = m.dup_id;
update labor_entries e set category_id = m.keep_id from category_merge m where e.category_id = m.dup_id;
update sale_entries e set category_id = m.keep_id from category_merge m where e.category_id = m.dup_id;
delete from categories c using category_merge m where c.id = m.dup_id;
drop table category_merge;

-- Put every existing cost tag under Agro, Household or Other. Must stay in step with inferCategoryGroup() in
-- src/domain/categoryGroups.ts. Anything unrecognised goes to Other; move it in Settings -> Categories.
update categories
set category_group = case
  when lower(trim(name)) in ('labour', 'labor', 'seeds', 'seed', 'nursery / saplings', 'saplings', 'fertilizer', 'chemical fertilizer', 'organic fertilizer', 'cowdung', 'pesticide', 'pesticides', 'herbicide', 'fungicide', 'irrigation', 'equipment', 'equipment / tools', 'land rent', 'transport') then 'agro'
  when lower(trim(name)) in ('groceries', 'fish', 'meat', 'vegetables', 'dairy & eggs', 'processed foods', 'medicine', 'education', 'fuel', 'utilities', 'house rent', 'clothing', 'mobile / internet') then 'household'
  else 'other'
end
where kind = 'cost' and category_group is null;

-- The old catch-all "Other" belongs to the Other category; "Equipment" is now "Equipment / Tools".
update categories c set name = 'Equipment / Tools'
where c.name = 'Equipment' and c.is_built_in
  and not exists (select 1 from categories other where other.user_id = c.user_id and other.name = 'Equipment / Tools');

-- Add any default tags a user doesn't have yet (matched by name, ignoring case), without touching their own.
insert into categories (user_id, name, kind, category_group, is_built_in)
select u.id, d.name, d.kind, d.category_group, true
from auth.users u
cross join (values
  ('Labour', 'cost', 'agro'),
  ('Seeds', 'cost', 'agro'),
  ('Nursery / Saplings', 'cost', 'agro'),
  ('Chemical Fertilizer', 'cost', 'agro'),
  ('Organic Fertilizer', 'cost', 'agro'),
  ('Cowdung', 'cost', 'agro'),
  ('Pesticide', 'cost', 'agro'),
  ('Herbicide', 'cost', 'agro'),
  ('Fungicide', 'cost', 'agro'),
  ('Irrigation', 'cost', 'agro'),
  ('Equipment / Tools', 'cost', 'agro'),
  ('Land Rent', 'cost', 'agro'),
  ('Transport', 'cost', 'agro'),
  ('Other (Agro)', 'cost', 'agro'),
  ('Groceries', 'cost', 'household'),
  ('Fish', 'cost', 'household'),
  ('Meat', 'cost', 'household'),
  ('Vegetables', 'cost', 'household'),
  ('Dairy & Eggs', 'cost', 'household'),
  ('Processed Foods', 'cost', 'household'),
  ('Medicine', 'cost', 'household'),
  ('Education', 'cost', 'household'),
  ('Utilities', 'cost', 'household'),
  ('House Rent', 'cost', 'household'),
  ('Clothing', 'cost', 'household'),
  ('Fuel', 'cost', 'household'),
  ('Mobile / Internet', 'cost', 'household'),
  ('Other (Household)', 'cost', 'household'),
  ('Loan Repayment', 'cost', 'other'),
  ('Zakat / Donation', 'cost', 'other'),
  ('Gifts', 'cost', 'other'),
  ('Travel', 'cost', 'other'),
  ('Other', 'cost', 'other'),
  ('Harvest Sale', 'revenue', null),
  ('Other Income', 'revenue', null)
) as d(name, kind, category_group)
where not exists (
  select 1 from categories existing
  where existing.user_id = u.id and lower(existing.name) = lower(d.name) and existing.kind = d.kind
);

commit;
