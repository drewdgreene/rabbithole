/**
 * Estimate read time in minutes from article text.
 * Assumes ~200 words per minute average reading speed.
 */
export function estimateReadTime(text: string): number {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
