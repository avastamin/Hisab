import { getAppData } from "@/lib/data/queries";
import { addTag, deleteTag } from "@/lib/actions/settings";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, SubmitButton } from "@/components/form/Field";
import { Trash2 } from "lucide-react";

export default async function TagsPage() {
  const { tags } = await getAppData();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tags" backHref="/settings" />

      <Card>
        <form action={addTag} className="flex flex-col gap-3">
          <Field label="Name">
            <TextInput type="text" name="name" required />
          </Field>
          <SubmitButton>Add Tag</SubmitButton>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {tags.map((t) => (
          <Card key={t.id} className="flex items-center justify-between py-3">
            <p className="font-medium text-text-primary">{t.name}</p>
            <form action={deleteTag}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="p-1 text-text-secondary">
                <Trash2 size={18} />
              </button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
