import type { FeedItem, FeedContext } from '../../types';
import { estimateReadTime } from '../../utils/readTime';
import { extractSurprisingClaim } from './excerptOptimization';

/**
 * Assign a card visual variant based on source, curiosity, and context.
 */
export function assignCardVariant(item: FeedItem, ctx: FeedContext): FeedItem['cardVariant'] {
  // Candidate fact cards: discovery curiosity magnets, high-curiosity without thumbnail, exploration
  const isFactCandidate =
    (item.source === 'discovery' &&
      (item.sourceDetail?.includes('unusual') || (item.curiosityScore || 0) > 0.5)) ||
    ((item.curiosityScore || 0) > 0.6 && !item.article.thumbnailUrl) ||
    item.source === 'exploration';

  // Only assign fact if the content can actually deliver a surprising claim
  if (isFactCandidate) {
    const claim = extractSurprisingClaim(item.article.excerpt, item.article.title);
    if (claim) return 'fact';
  }

  // Momentum/continuation with deep thread → 'thread'
  if ((item.source === 'momentum' || item.source === 'continuation') &&
      ctx.session.threadDepth > 2) {
    return 'thread';
  }

  // Current events → 'trending'
  if (item.source === 'current_events') {
    return 'trending';
  }

  // Bridge articles → 'bridge'
  if (item.sourceDetail?.startsWith('Bridging ') || item.positionIntent === 'stretch') {
    return 'bridge';
  }

  return 'standard';
}

/**
 * Generate contextual copy for a card (e.g., "3 deep in your rabbit hole").
 */
export function generateContextCopy(item: FeedItem, ctx: FeedContext): string {
  const readTime = estimateReadTime(item.article.excerpt);

  switch (item.cardVariant) {
    case 'fact':
      return item.sourceDetail || `${readTime} min read`;
    case 'thread':
      return `${ctx.session.threadDepth} deep in your rabbit hole`;
    case 'trending':
      return 'Trending now';
    case 'bridge': {
      const match = item.sourceDetail?.match(/Bridging (.+)/);
      return match ? match[1] : 'Cross-topic discovery';
    }
    default:
      return `${readTime} min read`;
  }
}
