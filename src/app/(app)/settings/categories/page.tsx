import { getAppData } from "@/lib/data/queries";
import { addCategory, deleteCategory } from "@/lib/actions/settings";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, Select, SubmitButton } from "@/components/form/Field";
import { Trash2 } from "lucide-react";

export default async function CategoriesPage() {
  const { categories } = await getAppData();

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
            {!c.isBuiltIn ? (
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="p-1 text-text-secondary">
                  <Trash2 size={18} />
                </button>
              </form>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
