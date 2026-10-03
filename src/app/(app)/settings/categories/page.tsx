import { getAppData } from "@/lib/data/queries";
import { addCategory, deleteCategory } from "@/lib/actions/settings";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, SubmitButton } from "@/components/form/Field";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export default async function CategoriesPage() {
  const { categories, expenseEntries, laborEntries, saleEntries } = await getAppData();
  // The database won't delete a category that entries still use, so only offer it for unused ones.
  const entryCount = (id: string) =>
    [...expenseEntries, ...laborEntries, ...saleEntries].filter((e) => e.categoryId === id).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Categories" backHref="/settings" />

      <Card>
        <form action={addCategory} className="flex flex-col gap-3">
          <Field label="Name">
            <TextInput type="text" name="name" required />
          </Field>
          <Field label="Kind">
            <Select name="kind" defaultValue="cost">
              <option value="cost">Cost</option>
              <option value="revenue">Revenue</option>
            </Select>
          </Field>
          <SubmitButton>Add Category</SubmitButton>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {categories.map((c) => (
          <Card key={c.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text-primary">{c.name}</p>
              <p className="text-xs text-text-secondary">{c.kind === "cost" ? "Cost" : "Revenue"}{c.isBuiltIn ? " · built-in" : ""}</p>
            </div>
            {c.isBuiltIn ? null : entryCount(c.id) === 0 ? (
              <ConfirmDeleteButton action={deleteCategory} id={c.id} label="category" message={`Delete the category "${c.name}"?`} compact />
            ) : (
              <span className="text-xs text-text-secondary">
                {entryCount(c.id)} entr{entryCount(c.id) === 1 ? "y" : "ies"}
              </span>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
