/** Where to go after editing or deleting an entry. Only same-site paths are allowed, so a crafted link can't redirect off-site. */
export function safeReturnTo(value: unknown): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
