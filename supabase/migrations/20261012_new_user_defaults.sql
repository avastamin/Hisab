-- Follow-up to 20261005_category_groups.sql, which updated existing data but not the function that gives a new
-- account its default tags. Accounts created since then got the old list with no category assigned.
--
-- Run once in the Supabase SQL editor. One transaction; safe to re-run. It:
--   * installs the new defaults for future sign-ups (same function as in schema.sql)
--   * gives accounts created in the meantime a category for each tag and the default tags they're missing
-- Nothing is deleted, and tags you've added, renamed or moved are left alone.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into categories (user_id, name, kind, category_group, is_built_in) values
    (new.id, 'Labour', 'cost', 'agro', true),
    (new.id, 'Seeds', 'cost', 'agro', true),
    (new.id, 'Nursery / Saplings', 'cost', 'agro', true),
    (new.id, 'Chemical Fertilizer', 'cost', 'agro', true),
    (new.id, 'Organic Fertilizer', 'cost', 'agro', true),
    (new.id, 'Cowdung', 'cost', 'agro', true),
    (new.id, 'Pesticide', 'cost', 'agro', true),
    (new.id, 'Herbicide', 'cost', 'agro', true),
    (new.id, 'Fungicide', 'cost', 'agro', true),
    (new.id, 'Irrigation', 'cost', 'agro', true),
    (new.id, 'Equipment / Tools', 'cost', 'agro', true),
    (new.id, 'Land Rent', 'cost', 'agro', true),
    (new.id, 'Transport', 'cost', 'agro', true),
    (new.id, 'Other (Agro)', 'cost', 'agro', true),
    (new.id, 'Groceries', 'cost', 'household', true),
    (new.id, 'Fish', 'cost', 'household', true),
    (new.id, 'Meat', 'cost', 'household', true),
    (new.id, 'Vegetables', 'cost', 'household', true),
    (new.id, 'Dairy & Eggs', 'cost', 'household', true),
    (new.id, 'Processed Foods', 'cost', 'household', true),
    (new.id, 'Medicine', 'cost', 'household', true),
    (new.id, 'Education', 'cost', 'household', true),
    (new.id, 'Utilities', 'cost', 'household', true),
    (new.id, 'House Rent', 'cost', 'household', true),
    (new.id, 'Clothing', 'cost', 'household', true),
    (new.id, 'Fuel', 'cost', 'household', true),
    (new.id, 'Mobile / Internet', 'cost', 'household', true),
    (new.id, 'Other (Household)', 'cost', 'household', true),
    (new.id, 'Loan Repayment', 'cost', 'other', true),
    (new.id, 'Zakat / Donation', 'cost', 'other', true),
    (new.id, 'Gifts', 'cost', 'other', true),
    (new.id, 'Travel', 'cost', 'other', true),
    (new.id, 'Other', 'cost', 'other', true),
    (new.id, 'Harvest Sale', 'revenue', null, true),
    (new.id, 'Other Income', 'revenue', null, true);

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

-- Accounts created between the two migrations: the same steps as before (they only touch what's still missing).
update categories c set name = 'Labour'
where c.name = 'Labor' and c.is_built_in
  and not exists (select 1 from categories other where other.user_id = c.user_id and other.name = 'Labour');

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
