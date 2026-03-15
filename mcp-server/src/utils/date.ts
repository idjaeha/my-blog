/**
 * Generate a KST (UTC+9) ISO datetime string.
 */
export function nowKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60;
  const kst = new Date(
    now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60000,
  );

  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, "0");
  const day = String(kst.getDate()).padStart(2, "0");
  const hours = String(kst.getHours()).padStart(2, "0");
  const minutes = String(kst.getMinutes()).padStart(2, "0");
  const seconds = String(kst.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
}

/**
 * Ensure a date value is an ISO string, not a Date object.
 * gray-matter's YAML parser converts date strings to Date objects,
 * which lose timezone info when serialized back.
 */
export function preserveDateString(value: unknown): string | undefined {
  if (value instanceof Date) {
    const kstOffset = 9 * 60;
    const kst = new Date(
      value.getTime() + (kstOffset + value.getTimezoneOffset()) * 60000,
    );

    const year = kst.getFullYear();
    const month = String(kst.getMonth() + 1).padStart(2, "0");
    const day = String(kst.getDate()).padStart(2, "0");
    const hours = String(kst.getHours()).padStart(2, "0");
    const minutes = String(kst.getMinutes()).padStart(2, "0");
    const seconds = String(kst.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

/**
 * Fix date fields in frontmatter data that were auto-parsed by js-yaml.
 * Call this after matter(raw) to preserve datetime precision.
 */
export function fixFrontmatterDates(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const dateFields = ["publishedDate", "updatedDate"];
  for (const field of dateFields) {
    if (data[field] !== undefined) {
      data[field] = preserveDateString(data[field]);
    }
  }
  return data;
}
