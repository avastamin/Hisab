import type { Category } from "@/domain/types";

/** The built-in labour category (spelt "Labor" before the rename, so both are matched). Picking it on the expense form asks for a worker. */
export function isLabourCategory(category: Pick<Category, "name"> | undefined): boolean {
  return !!category && /^labou?r$/i.test(category.name.trim());
}
