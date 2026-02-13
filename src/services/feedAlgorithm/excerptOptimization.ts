import { DEFINITIONAL_PATTERN } from './tuning';

// Reuse same patterns from curiosityScoring (kept as module-local for perf)
const QUESTION_PATTERN = /\?|^(who|what|where|when|why|how|is|are|was|were|can|could|do|does|did)\b/i;
const SUPERLATIVE_PATTERN = /\b(most|largest|biggest|smallest|oldest|youngest|first|last|best|worst|greatest|deadliest|longest|shortest|tallest|fastest|rarest|richest|poorest)\b/i;
const NUMBER_PATTERN = /\b\d+\b/;
const MYSTERY_PATTERN = /\b(mystery|mysterious|unknown|unexplained|secret|hidden|lost|disappeared|unsolved|conspiracy|paradox|anomaly|enigma|controversial|forbidden|haunted|cursed)\b/i;
const CONFLICT_PATTERN = /\b(death|dead|died|killed|murder|war|battle|invasion|disaster|catastrophe|destruction|massacre|assassination|explosion|crash|collapse|epidemic|plague|famine|genocide)\b/i;
const SCARCITY_PATTERN = /\b(only|never|impossible|accidentally|almost|rarely|forbidden|last known|sole surviving|one of the few)\b/i;

/**
 * Optimize excerpt for maximum hook potential.
 * Finds the most curiosity-inducing sentence and leads with it.
 */
export function optimizeExcerpt(excerpt: string): string {
  if (excerpt.length < 80) return excerpt;

  // --- Template-based hooks: check for high-impact patterns first ---

  // Tragically short life: "(1856-1890)" → "Lived only 34 years."
  const ageMatch = excerpt.match(/\((\d{3,4})\s*[-–]\s*(\d{3,4})\)/);
  if (ageMatch) {
    const age = parseInt(ageMatch[2]) - parseInt(ageMatch[1]);
    if (age > 0 && age < 40) {
      const hookPrefix = `Lived only ${age} years. `;
      const cleaned = excerpt.replace(/\([^)]*\)/, '').trim();
      if (cleaned.length > 60) return truncateExcerpt(hookPrefix + cleaned);
    }
  }

  // Buried superlative: pull it forward
  const supMatch = excerpt.match(/\b(the\s+(?:most|largest|biggest|smallest|oldest|youngest|first|last|greatest|deadliest|longest|shortest|tallest|fastest|rarest)\s+[^,.]+)/i);
  if (supMatch && supMatch.index !== undefined && supMatch.index > 20) {
    return truncateExcerpt(supMatch[1].charAt(0).toUpperCase() + supMatch[1].slice(1) + '. ' + excerpt);
  }

  // Controversy/scandal lead
  if (/\b(controversy|controversial|scandal|disputed|infamous)\b/i.test(excerpt)) {
    const cSentences = excerpt.split(/(?<=[.!?])\s+/).filter(s => s.length > 10);
    const conflictSentence = cSentences.find(s => /\b(controversy|scandal|disputed|infamous)\b/i.test(s));
    if (conflictSentence && cSentences.indexOf(conflictSentence) > 0) {
      return truncateExcerpt(conflictSentence + ' ' + cSentences[0]);
    }
  }

  // --- Existing sentence reorder logic ---

  // Split into sentences
  const sentences = excerpt.split(/(?<=[.!?])\s+/).filter(s => s.length > 10);
  if (sentences.length <= 1) return excerpt;

  // Score each sentence for curiosity hooks
  const scored = sentences.map((sentence, idx) => {
    let score = 0;
    if (MYSTERY_PATTERN.test(sentence)) score += 0.3;
    if (CONFLICT_PATTERN.test(sentence)) score += 0.25;
    if (SUPERLATIVE_PATTERN.test(sentence)) score += 0.2;
    if (QUESTION_PATTERN.test(sentence)) score += 0.2;
    if (NUMBER_PATTERN.test(sentence)) score += 0.1;
    if (SCARCITY_PATTERN.test(sentence)) score += 0.15;
    // Slight penalty for definitional openings
    if (idx === 0 && /^[A-Z][a-z]+ (is|was|are|were) (a|an|the) /i.test(sentence)) score -= 0.15;
    return { sentence, score, idx };
  });

  const first = scored[0];
  const best = scored.reduce((a, b) => a.score > b.score ? a : b);

  // Only reorder if the best sentence is significantly more interesting
  let result: string;
  if (best.idx !== 0 && best.score - first.score >= 0.15) {
    // Lead with the hook sentence, then the rest
    const remaining = sentences.filter((_, i) => i !== best.idx);
    result = [best.sentence, ...remaining].join(' ');
  } else {
    result = excerpt;
  }

  // Truncate to ~200 chars, trying to cut at a cliffhanger
  if (result.length > 200) {
    const cliffhangerWords = /\b(but|however|when|until|although|despite|yet|before|after)\b/gi;
    let lastCliffhanger = -1;
    let match;
    while ((match = cliffhangerWords.exec(result)) !== null) {
      if (match.index > 100 && match.index < 200) {
        lastCliffhanger = match.index;
      }
    }

    if (lastCliffhanger > 100) {
      result = result.substring(0, lastCliffhanger).trim() + '...';
    } else {
      // Cut at last sentence boundary before 200 chars
      const truncated = result.substring(0, 200);
      const lastPeriod = truncated.lastIndexOf('.');
      if (lastPeriod > 100) {
        result = truncated.substring(0, lastPeriod + 1);
      } else {
        result = truncated.trim() + '...';
      }
    }
  }

  return result;
}

/**
 * Truncate text to ~200 chars, preferring cliffhanger cut points.
 */
export function truncateExcerpt(text: string): string {
  if (text.length <= 200) return text;

  const cliffhangerWords = /\b(but|however|when|until|although|despite|yet|before|after)\b/gi;
  let lastCliffhanger = -1;
  let match;
  while ((match = cliffhangerWords.exec(text)) !== null) {
    if (match.index > 100 && match.index < 200) lastCliffhanger = match.index;
  }

  if (lastCliffhanger > 100) return text.substring(0, lastCliffhanger).trim() + '...';

  const truncated = text.substring(0, 200);
  const lastPeriod = truncated.lastIndexOf('.');
  return lastPeriod > 100 ? truncated.substring(0, lastPeriod + 1) : truncated.trim() + '...';
}

/**
 * Extract the single most surprising claim from an excerpt.
 * Used for "Did you know?" fact cards — isolates one punchy sentence
 * instead of showing the full multi-sentence excerpt.
 */
export function extractSurprisingClaim(excerpt: string, title: string): string | null {
  const sentences = excerpt.split(/(?<=[.!?])\s+/).filter(s => s.length > 15);
  if (sentences.length === 0) return null;

  const scored = sentences.map((sentence, idx) => {
    let score = 0;

    // ── Positive: genuine surprise signals ──
    if (SCARCITY_PATTERN.test(sentence)) score += 0.4;
    if (MYSTERY_PATTERN.test(sentence)) score += 0.35;
    if (SUPERLATIVE_PATTERN.test(sentence)) score += 0.3;
    if (CONFLICT_PATTERN.test(sentence)) score += 0.2;
    if (/\b\d{1,3}(,\d{3})+\b/.test(sentence)) score += 0.25;
    if (/\b\d+(\.\d+)?%/.test(sentence)) score += 0.2;
    if (/\b\d+\s*(years?|months?|days?|hours?|miles?|km|feet|meters?)\b/i.test(sentence)) score += 0.15;
    if (/^(despite|although|however|yet|but)\b/i.test(sentence)) score += 0.3;
    if (/,\s*(but|yet|however|although)\s/i.test(sentence)) score += 0.2;

    // ── Negative: boring content ──
    if (DEFINITIONAL_PATTERN.test(sentence)) score -= 0.5;
    if (/^[A-Z][a-z]+\s+(is|was|are|were)\s+(a|an|the)\s/i.test(sentence)) score -= 0.4;
    // Academic filler / hypothetical constructions
    if (/^(if,?\s+for (instance|example)|for (instance|example),?\s+if|one might|it (should|must|can) be noted|it is (important|worth|interesting) to note|there (is|are) (many|several|various|numerous))\b/i.test(sentence)) score -= 0.5;
    // Vague pedagogical waffle
    if (/\b(can be (seen|viewed|understood|considered) as|in (this|that) (sense|context|regard)|broadly (speaking|defined)|generally (speaking|refers?))\b/i.test(sentence)) score -= 0.4;
    // Title restatement in first sentence
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const sentLower = sentence.toLowerCase();
    const titleOverlap = titleWords.filter(w => sentLower.includes(w)).length / Math.max(titleWords.length, 1);
    if (titleOverlap > 0.6 && idx === 0) score -= 0.3;
    // Too long for the card (>160 chars will truncate on 4 lines)
    if (sentence.length > 160) score -= 0.3;

    return { sentence, score, idx };
  });

  const best = scored.reduce((a, b) => a.score > b.score ? a : b);

  // High bar: need at least one real surprise signal to justify "DID YOU KNOW?"
  if (best.score < 0.2) return null;

  return best.sentence;
}
