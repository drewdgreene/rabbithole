import { categories } from '../services/categoryData';

/**
 * Map raw Wikipedia category strings to our app taxonomy categories.
 * Uses fuzzy matching (lowercase substring check) against each taxonomy
 * category's wikiCategories list. Returns up to 3 unique matches.
 */
export function mapWikiCategoriesToTaxonomy(
  wikiCategories: string[]
): { id: string; name: string }[] {
  if (wikiCategories.length === 0) return [];

  const matched: { id: string; name: string }[] = [];
  const seen = new Set<string>();

  for (const cat of categories) {
    const hasOverlap = cat.wikiCategories.some(wc =>
      wikiCategories.some(ac =>
        ac.toLowerCase().includes(wc.toLowerCase().replace(/_/g, ' ')) ||
        wc.toLowerCase().replace(/_/g, ' ').includes(ac.toLowerCase())
      )
    );
    if (hasOverlap && !seen.has(cat.id)) {
      seen.add(cat.id);
      matched.push({ id: cat.id, name: cat.name });
      if (matched.length >= 3) break;
    }
  }

  return matched;
}
