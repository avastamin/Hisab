import { getAppData } from "@/lib/data/queries";
import { addTag, deleteTag } from "@/lib/actions/settings";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Field, TextInput, SubmitButton } from "@/components/form/Field";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

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
            <ConfirmDeleteButton action={deleteTag} id={t.id} label="tag" message={`Delete the tag "${t.name}"? It will no longer show on entries that use it.`} compact />
          </Card>
        ))}
      </div>
    </div>
  );
}
