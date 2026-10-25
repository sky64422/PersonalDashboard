/** Normalize once per query; callers retain ownership of searchable fields. */
export function createTextMatcher(query: string): (text: string) => boolean {
  const normalized = query.trim().toLocaleLowerCase();
  return text => text.toLocaleLowerCase().includes(normalized);
}
