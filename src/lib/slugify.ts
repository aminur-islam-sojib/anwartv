/**
 * Bengali-safe slug generator. Unlike the `slugify` package's `strict: true`
 * mode (which strips non-Latin characters), this preserves Bengali Unicode
 * characters while still normalizing whitespace, case, and punctuation.
 * Used for articles, tags, and categories so slug behavior is consistent
 * across the app.
 */
export function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-\u0980-\u09FF]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}