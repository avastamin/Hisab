import { ChevronDown } from "lucide-react";
import { getAppData } from "@/lib/data/queries";
import { addCategory, updateCategory, deleteCategory } from "@/lib/actions/settings";
import { CATEGORY_GROUPS } from "@/domain/categoryGroups";
import type { Category } from "@/domain/types";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, SubmitButton } from "@/components/form/Field";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

// Spending is organised as category (Agro / Household / Other) → tag. Tags are rows of the `categories` table with a
// category_group; revenue categories (for sales) have none. See domain/categoryGroups.ts.
export default async function CategoriesPage() {
  const { categories, expenseEntries, laborEntries, saleEntries } = await getAppData();
  // The database won't delete a tag that entries still use, so only offer it for unused ones.
  const entryCount = (id: string) =>
    [...expenseEntries, ...laborEntries, ...saleEntries].filter((e) => e.categoryId === id).length;

  const sections = [
    ...CATEGORY_GROUPS.map((g) => ({
      key: g.id,
      title: g.label,
      items: categories.filter((c) => c.kind === "cost" && c.group === g.id),
    })),
    { key: "revenue", title: "Sales", items: categories.filter((c) => c.kind === "revenue") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Categories & Tags" backHref="/settings" />
      <p className="-mt-2 text-sm text-text-secondary">
        Every expense goes under a category (Agro, Household or Other) and one of its tags, so reports can show what
        each category costs, tag by tag.
      </p>

      <Card>
        <form action={addCategory} className="flex flex-col gap-3">
          <Field label="New tag">
            <TextInput type="text" name="name" placeholder="e.g. Tractor hire" required />
          </Field>
          <Field label="Under">
            <Select name="group" defaultValue="agro">
              {CATEGORY_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
          <input type="hidden" name="kind" value="cost" />
          <SubmitButton>Add Tag</SubmitButton>
        </form>
      </Card>

      {sections.map((section) => (
        <section key={section.key} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text-secondary">
            {section.title} <span className="font-normal">· {section.items.length}</span>
          </h2>
          <Card className="py-1">
            <ul className="divide-y divide-border">
              {section.items.map((c) => (
                <TagRow key={c.id} category={c} count={entryCount(c.id)} />
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

/** A tag that opens (no JavaScript needed) to rename it, move it to another category, or delete it if unused. */
function TagRow({ category, count }: { category: Category; count: number }) {
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5">
          <span className="text-sm font-medium text-text-primary">{category.name}</span>
          <span className="flex items-center gap-2 text-xs text-text-secondary">
            {count} entr{count === 1 ? "y" : "ies"}
            <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
          </span>
        </summary>
        <div className="flex flex-col gap-2 pb-3">
          <form action={updateCategory} className="flex flex-col gap-2">
            <input type="hidden" name="id" value={category.id} />
            <TextInput type="text" name="name" defaultValue={category.name} required aria-label="Name" />
            {category.group ? (
              <Select name="group" defaultValue={category.group} aria-label="Category">
                {CATEGORY_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    Under {g.label}
                  </option>
                ))}
              </Select>
            ) : null}
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-text">
              Save
            </button>
          </form>
          {count === 0 ? (
            <ConfirmDeleteButton
              action={deleteCategory}
              id={category.id}
              label="tag"
              message={`Delete "${category.name}"?`}
            />
          ) : (
            <p className="text-xs text-text-secondary">Used by {count} entr{count === 1 ? "y" : "ies"}, so it can&apos;t be deleted.</p>
          )}
        </div>
      </details>
    </li>
  );
}
