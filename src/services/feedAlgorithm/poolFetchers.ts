import type {
  FeedItem,
  FeedContext,
  FeedSourceType,
} from '../../types';
import { categories, getCategoryById } from '../categoryData';
import {
  getCategoryMembers,
  getArticleLinks,
  getFeaturedContent,
  getRandomArticles,
  batchGetSummaries,
  searchArticles,
} from '../wikipedia';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useArticleStore } from '../../store/articleStore';
import { TUNING, CURIOSITY_CATEGORIES } from './tuning';
import type { DecayedProfile } from './decayedProfile';
import { computeCuriosityScore, computeFreshnessScore, scoreLinkRelevance, computeContextualCuriosity } from './curiosityScoring';
import { selectWeightedCategories } from './helpers';

// ─── Category Pool ────────────────────────────────────────────

export async function fetchCategoryPool(
  ctx: FeedContext,
  targetSize: number,
  decayed: DecayedProfile
): Promise<FeedItem[]> {
  try {
    const numCategories = Math.min(6, Math.ceil(targetSize / 2));
    let weightedCats = selectWeightedCategories(decayed.decayedWeights, numCategories);

    // Filter out suppressed categories (session-level: 3+ skips, persistent: 15+ cumulative)
    const suppressed = new Set(ctx.session.suppressedCategories || []);
    const persistentSkips = ctx.profile.persistedCategorySkips || {};
    for (const [catId, count] of Object.entries(persistentSkips)) {
      if (count >= 15) suppressed.add(catId);
    }
    if (suppressed.size > 0) {
      weightedCats = weightedCats.filter(catId => !suppressed.has(catId));
      // If all were suppressed, re-select from unsuppressed pool
      if (weightedCats.length === 0) {
        const unsuppressed: Record<string, number> = {};
        for (const [id, w] of Object.entries(decayed.decayedWeights)) {
          if (!suppressed.has(id)) unsuppressed[id] = w;
        }
        weightedCats = selectWeightedCategories(unsuppressed, numCategories);
      }
    }

    if (weightedCats.length === 0) return [];

    const titlesByCategory: { titles: string[]; catId: string; catName: string }[] = [];

    // Resolve custom topics for lookup
    const customTopics = useOnboardingStore.getState().customTopics;
    const customTopicMap = new Map(customTopics.map(t => [t.id, t]));

    await Promise.all(
      weightedCats.map(async (catId) => {
        // Handle custom topics (prefixed with 'custom:')
        const customTopic = customTopicMap.get(catId);
        if (customTopic) {
          const members = await getCategoryMembers(customTopic.wikiCategory, 8);
          const titles = members
            .filter(m => !ctx.existingPageIds.has(m.pageId))
            .map(m => m.title);
          titlesByCategory.push({ titles, catId: customTopic.id, catName: customTopic.name });
          return;
        }

        // Handle static categories
        const cat = getCategoryById(catId);
        if (!cat) return;

        const wikiCats = cat.wikiCategories;
        const randomWikiCat = wikiCats[Math.floor(Math.random() * wikiCats.length)];

        const members = await getCategoryMembers(randomWikiCat, 8);
        const titles = members
          .filter(m => !ctx.existingPageIds.has(m.pageId))
          .map(m => m.title);

        titlesByCategory.push({ titles, catId: cat.id, catName: cat.name });
      })
    );

    const allTitles = titlesByCategory.flatMap(t => t.titles);
    const articles = await batchGetSummaries(allTitles.slice(0, targetSize));

    const { categoryScoring } = TUNING;

    return articles.map(article => {
      const source = titlesByCategory.find(t => t.titles.includes(article.title));
      const catId = source?.catId || '';
      const dWeight = decayed.decayedWeights[catId] || 0.05;
      const mom = decayed.momentum[catId] || 0;
      const momentumBoost = mom * categoryScoring.momentumMax; // Allows negative momentum to penalize
      const curiosity = computeCuriosityScore(article.title, article.excerpt);

      return {
        article,
        score: categoryScoring.base +
          dWeight * categoryScoring.weightFactor +
          momentumBoost +
          curiosity * categoryScoring.curiosityFactor +
          Math.random() * categoryScoring.randomJitter,
        source: 'category' as FeedSourceType,
        sourceDetail: source?.catName || 'Interests',
        curiosityScore: curiosity,
        freshnessScore: computeFreshnessScore(article.fetchedAt),
      };
    });
  } catch (error) {
    console.error('[FeedAlgorithm] Category pool error:', error);
    return [];
  }
}

// ─── Link Pool ────────────────────────────────────────────────

export async function fetchLinkPool(
  ctx: FeedContext,
  targetSize: number,
  decayed: DecayedProfile
): Promise<FeedItem[]> {
  try {
    const recentHistory = ctx.profile.readHistory.slice(-5);

    // Seed from both read history AND recently saved articles
    const seedTitles: string[] = [];

    // Add saved article titles first (higher priority seeds)
    for (const savedTitle of (ctx.recentSavedTitles || []).slice(0, 3)) {
      if (!seedTitles.includes(savedTitle)) seedTitles.push(savedTitle);
    }

    // Add read history titles from engagement log
    for (const pageIdStr of recentHistory.slice(-3)) {
      const entry = ctx.profile.engagementLog
        .filter(e => String(e.pageId) === pageIdStr)
        .pop();
      if (entry && !seedTitles.includes(entry.title)) {
        seedTitles.push(entry.title);
      }
    }

    if (seedTitles.length === 0) return [];

    const allLinkedTitles: { title: string; relevance: number }[] = [];

    await Promise.all(
      seedTitles.slice(0, 5).map(async (seedTitle) => {
        const { links } = await getArticleLinks(seedTitle, 30);

        // Score and filter links instead of random shuffle
        const scored = links
          .map(title => ({ title, relevance: scoreLinkRelevance(title, decayed) }))
          .filter(l => l.relevance > 0)
          .sort((a, b) => b.relevance - a.relevance);

        // If smart filtering is too aggressive, fall back to random
        if (scored.length < 3) {
          const shuffled = links.sort(() => Math.random() - 0.5);
          allLinkedTitles.push(...shuffled.slice(0, 5).map(title => ({ title, relevance: 0.3 })));
        } else {
          allLinkedTitles.push(...scored.slice(0, 7));
        }
      })
    );

    if (allLinkedTitles.length === 0) return [];

    // Deduplicate, keep highest-relevance version
    const seen = new Set<string>();
    const uniqueLinks = allLinkedTitles
      .sort((a, b) => b.relevance - a.relevance)
      .filter(l => { if (seen.has(l.title)) return false; seen.add(l.title); return true; })
      .slice(0, targetSize);

    const articles = await batchGetSummaries(uniqueLinks.map(l => l.title));

    return articles
      .filter(a => !ctx.existingPageIds.has(a.pageId))
      .map(article => {
        const linkInfo = uniqueLinks.find(l => l.title === article.title);
        const curiosity = computeContextualCuriosity(article.title, article.excerpt, article.categories, decayed);
        return {
          article,
          score: 0.45 + (linkInfo?.relevance || 0.3) * 0.2 + Math.random() * 0.10,
          source: 'link' as FeedSourceType,
          sourceDetail: 'Related article',
          curiosityScore: curiosity,
          freshnessScore: computeFreshnessScore(article.fetchedAt),
        };
      });
  } catch (error) {
    console.error('[FeedAlgorithm] Link pool error:', error);
    return [];
  }
}

// ─── Current Events Pool ──────────────────────────────────────

export async function fetchCurrentEventsPool(
  ctx: FeedContext,
  targetSize: number,
  decayed: DecayedProfile
): Promise<FeedItem[]> {
  try {
    const { mostRead, news } = await getFeaturedContent();

    const candidates = [
      ...news.slice(0, 10).map(n => ({ ...n, isNews: true })),
      ...mostRead.slice(0, 20).map(m => ({ ...m, isNews: false })),
    ];

    if (candidates.length === 0) return [];

    const filtered = candidates.filter(c => c.pageId && !ctx.existingPageIds.has(c.pageId));

    const topCatIds = Object.entries(decayed.decayedWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([id]) => id);

    const scored = filtered.map(candidate => {
      let interestScore = 0.2;
      const titleLower = candidate.title.toLowerCase();

      for (const catId of topCatIds) {
        const cat = getCategoryById(catId);
        if (!cat) continue;
        const catNameLower = cat.name.toLowerCase();
        if (titleLower.includes(catNameLower) || catNameLower.includes(titleLower.split(' ')[0])) {
          interestScore += 0.2;
          break;
        }
      }

      if (candidate.isNews) interestScore += 0.1;

      return { ...candidate, interestScore };
    });

    scored.sort((a, b) => b.interestScore - a.interestScore);
    const topCandidates = scored.slice(0, targetSize);

    const items: FeedItem[] = [];
    for (const c of topCandidates) {
      if (c.extract && c.pageId) {
        const curiosity = computeCuriosityScore(c.title, c.extract || '');
        items.push({
          article: {
            pageId: c.pageId,
            title: c.title,
            displayTitle: c.title.replace(/_/g, ' '),
            excerpt: c.extract || '',
            thumbnailUrl: c.thumbnail,
            categories: [],
            contentUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(c.title.replace(/ /g, '_'))}`,
            fetchedAt: Date.now(),
          },
          score: 0.3 + c.interestScore,
          source: 'current_events' as FeedSourceType,
          sourceDetail: c.isNews ? 'In the News' : 'Trending',
          curiosityScore: curiosity,
          freshnessScore: 1.0, // Current events are always fresh
        });
      }
    }

    return items;
  } catch (error) {
    console.error('[FeedAlgorithm] Current events pool error:', error);
    return [];
  }
}

// ─── Discovery Pool ──────────────────────────────────────────

export async function fetchDiscoveryPool(
  ctx: FeedContext,
  targetSize: number
): Promise<FeedItem[]> {
  try {
    const items: FeedItem[] = [];

    // 1. Quality articles: Featured + Good articles (~50%)
    const qualityTarget = Math.ceil(targetSize * 0.5);
    // 2. Curiosity magnets: interesting meta-categories (~30%)
    const curiosityTarget = Math.ceil(targetSize * 0.3);
    // 3. Random fallback (~20%)
    const randomTarget = Math.max(1, targetSize - qualityTarget - curiosityTarget);

    // Run all 3 sub-sources in parallel
    const [qualityTitles, curiosityTitles, randomTitles, featuredData] = await Promise.all([
      // Quality: Featured and Good articles
      Promise.all([
        getCategoryMembers('Featured_articles', qualityTarget),
        getCategoryMembers('Good_articles', qualityTarget),
      ]).then(([featured, good]) => {
        const combined = [...featured, ...good];
        // Shuffle and deduplicate
        const seen = new Set<number>();
        return combined
          .sort(() => Math.random() - 0.5)
          .filter(m => { if (seen.has(m.pageId)) return false; seen.add(m.pageId); return true; })
          .map(m => m.title)
          .slice(0, qualityTarget);
      }),

      // Curiosity magnets: random pick from interesting categories
      (async () => {
        const shuffled = [...CURIOSITY_CATEGORIES].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, 2);
        const results = await Promise.all(
          picked.map(cat => getCategoryMembers(cat, 8))
        );
        return results
          .flat()
          .sort(() => Math.random() - 0.5)
          .map(m => m.title)
          .slice(0, curiosityTarget);
      })(),

      // Random fallback
      getRandomArticles(randomTarget + 5),

      // Featured article of the day
      getFeaturedContent(),
    ]);

    // Search echo: surface content related to recent searches
    const recentSearches = (ctx.profile.searchHistory || [])
      .filter(s => Date.now() - s.timestamp < 86400000 * 2) // Last 48 hours
      .slice(-3);

    let searchEchoTitles: string[] = [];
    let searchEchoQuery = '';
    if (recentSearches.length > 0) {
      const picked = recentSearches[Math.floor(Math.random() * recentSearches.length)];
      searchEchoQuery = picked.query;
      try {
        const echoResults = await searchArticles(picked.query, 3);
        searchEchoTitles = echoResults.map(r => r.title);
      } catch {
        // Ignore search errors
      }
    }

    // Fetch summaries for all titles
    const allTitles = [...new Set([...qualityTitles, ...curiosityTitles, ...randomTitles, ...searchEchoTitles])];
    const articles = await batchGetSummaries(allTitles.slice(0, targetSize + 5));

    const qualitySet = new Set(qualityTitles);
    const curiositySet = new Set(curiosityTitles);
    const searchEchoSet = new Set(searchEchoTitles);

    for (const article of articles) {
      if (ctx.existingPageIds.has(article.pageId)) continue;
      if (article.excerpt.length < 80) continue; // Stronger stub filter

      const isQuality = qualitySet.has(article.title);
      const isCuriosity = curiositySet.has(article.title);
      const isSearchEcho = searchEchoSet.has(article.title);
      const curiosity = computeCuriosityScore(article.title, article.excerpt);

      items.push({
        article,
        score: isQuality ? 0.25 + Math.random() * 0.15
             : isCuriosity ? 0.20 + Math.random() * 0.15
             : isSearchEcho ? 0.30 + Math.random() * 0.12
             : 0.10 + Math.random() * 0.15,
        source: 'discovery' as FeedSourceType,
        sourceDetail: isQuality ? 'Featured article'
                    : isCuriosity ? 'Discover something unusual'
                    : isSearchEcho ? `Related to "${searchEchoQuery}"`
                    : 'Discover something new',
        curiosityScore: curiosity,
        freshnessScore: computeFreshnessScore(article.fetchedAt),
      });
    }

    // Inject today's featured article if available
    if (featuredData.tfa && !ctx.existingPageIds.has(featuredData.tfa.pageId)) {
      const tfaExists = items.some(i => i.article.pageId === featuredData.tfa!.pageId);
      if (!tfaExists && featuredData.tfa.extract) {
        items.unshift({
          article: {
            pageId: featuredData.tfa.pageId,
            title: featuredData.tfa.title,
            displayTitle: featuredData.tfa.title,
            excerpt: featuredData.tfa.extract,
            thumbnailUrl: featuredData.tfa.thumbnail,
            categories: [],
            contentUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(featuredData.tfa.title.replace(/ /g, '_'))}`,
            fetchedAt: Date.now(),
          },
          score: 0.40,
          source: 'discovery' as FeedSourceType,
          sourceDetail: "Today's featured article",
          curiosityScore: computeCuriosityScore(featuredData.tfa.title, featuredData.tfa.extract),
          freshnessScore: 1.0,
        });
      }
    }

    return items.slice(0, targetSize);
  } catch (error) {
    console.error('[FeedAlgorithm] Discovery pool error:', error);
    return [];
  }
}

// ─── Momentum Pool ────────────────────────────────────────────

/**
 * Momentum pool: fetch links from the last-read article this session.
 * Creates the "rabbit hole" effect — keep reading related content.
 * Only active when user has read something this session.
 */
export async function fetchMomentumPool(
  ctx: FeedContext,
  targetSize: number,
  decayed: DecayedProfile
): Promise<FeedItem[]> {
  try {
    const lastRead = ctx.session.lastReadArticle;
    if (!lastRead) return [];

    // Priority 1: See Also links from article cache (curated by Wikipedia editors)
    const cachedArticle = useArticleStore.getState().getArticle(lastRead.pageId);
    const seeAlsoTitles = cachedArticle?.seeAlsoLinks || [];

    // Priority 2: Scored outgoing links (with blocklist + relevance scoring)
    const { links } = await getArticleLinks(lastRead.title, 50);

    const scoredLinks = links
      .map(title => ({ title, relevance: scoreLinkRelevance(title, decayed) }))
      .filter(l => l.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

    // Combine: See Also first (1.5x score boost), then scored body links
    const candidates: { title: string; baseScore: number; isSeeAlso: boolean }[] = [];

    for (const title of seeAlsoTitles) {
      candidates.push({
        title,
        baseScore: 0.80, // High base for curated links
        isSeeAlso: true,
      });
    }

    for (const link of scoredLinks.slice(0, 15)) {
      if (!candidates.some(c => c.title === link.title)) {
        candidates.push({
          title: link.title,
          baseScore: 0.50 + link.relevance * 0.25,
          isSeeAlso: false,
        });
      }
    }

    if (candidates.length === 0) return [];

    // Fetch summaries for top candidates
    const toFetch = candidates.slice(0, targetSize + 5).map(c => c.title);
    const articles = await batchGetSummaries(toFetch);

    return articles
      .filter(a => !ctx.existingPageIds.has(a.pageId))
      .slice(0, targetSize)
      .map(article => {
        const info = candidates.find(c => c.title === article.title);
        const curiosity = computeContextualCuriosity(
          article.title, article.excerpt, article.categories, decayed
        );
        return {
          article,
          score: (info?.baseScore || 0.65) + curiosity * 0.15 + Math.random() * 0.08,
          source: 'momentum' as FeedSourceType,
          sourceDetail: info?.isSeeAlso
            ? `Related to ${lastRead.title}`
            : `Because you read ${lastRead.title}`,
          curiosityScore: curiosity,
          freshnessScore: computeFreshnessScore(article.fetchedAt),
        };
      });
  } catch (error) {
    console.error('[FeedAlgorithm] Momentum pool error:', error);
    return [];
  }
}

// ─── Continuation Pool ────────────────────────────────────────

/**
 * Continuation pool: surface unfinished threads from the previous session.
 * Creates return hooks — "pick up where you left off".
 * Only active on initial load when daysSinceLastSession >= 1.
 */
export async function fetchContinuationPool(
  ctx: FeedContext,
  targetSize: number
): Promise<FeedItem[]> {
  try {
    const summary = ctx.previousSessionSummary;
    if (!summary || ctx.daysSinceLastSession < 1) return [];
    if (summary.unfinishedThreads.length === 0) return [];

    const allTitles: { title: string; threadTitle: string }[] = [];

    // Get links from each unfinished thread's last article
    for (const thread of summary.unfinishedThreads.slice(0, 2)) {
      const { links } = await getArticleLinks(thread.lastArticleTitle, 10);
      const shuffled = links.sort(() => Math.random() - 0.5);
      for (const title of shuffled.slice(0, 3)) {
        allTitles.push({ title, threadTitle: thread.seedTitle });
      }
    }

    if (allTitles.length === 0) return [];

    const uniqueTitles = [...new Set(allTitles.map(t => t.title))].slice(0, targetSize);
    const articles = await batchGetSummaries(uniqueTitles);

    return articles
      .filter(a => !ctx.existingPageIds.has(a.pageId))
      .slice(0, targetSize)
      .map(article => {
        const threadInfo = allTitles.find(t => t.title === article.title);
        const curiosity = computeCuriosityScore(article.title, article.excerpt);
        return {
          article,
          score: 0.70 + Math.random() * 0.1,
          source: 'continuation' as FeedSourceType,
          sourceDetail: `Continue: ${threadInfo?.threadTitle || 'your thread'}`,
          curiosityScore: curiosity,
          freshnessScore: computeFreshnessScore(article.fetchedAt),
        };
      });
  } catch (error) {
    console.error('[FeedAlgorithm] Continuation pool error:', error);
    return [];
  }
}

// ─── Bridge Articles Pool ─────────────────────────────────────

/**
 * Bridge articles: find content that spans two categories the user
 * frequently reads together. Creates "wait, what?" cross-domain moments.
 * Uses topicPairs from the interest profile (tracked but previously unused).
 */
export async function fetchBridgeArticles(
  ctx: FeedContext,
  decayed: DecayedProfile,
  targetSize: number
): Promise<FeedItem[]> {
  try {
    const topPairs = (ctx.profile.topicPairs || [])
      .filter(p => p.coCount >= 3)
      .sort((a, b) => b.coCount - a.coCount)
      .slice(0, 3);

    if (topPairs.length === 0) return [];

    const allResults: { title: string; pageId: number; excerpt: string; pairLabel: string }[] = [];

    await Promise.all(
      topPairs.map(async (pair) => {
        const catA = getCategoryById(pair.catA);
        const catB = getCategoryById(pair.catB);
        if (!catA || !catB) return;

        const query = `${catA.name} ${catB.name}`;
        const results = await searchArticles(query, 5);

        for (const r of results) {
          if (ctx.existingPageIds.has(r.pageId)) continue;
          if (r.excerpt.length < 50) continue;
          allResults.push({
            ...r,
            pairLabel: `${catA.name} + ${catB.name}`,
          });
        }
      })
    );

    if (allResults.length === 0) return [];

    // Deduplicate
    const seen = new Set<number>();
    const unique = allResults.filter(r => {
      if (seen.has(r.pageId)) return false;
      seen.add(r.pageId);
      return true;
    });

    // Fetch full summaries
    const articles = await batchGetSummaries(unique.slice(0, targetSize).map(r => r.title));

    const readSet = new Set(ctx.profile.readHistory.map(id => parseInt(id, 10)));

    return articles
      .filter(a => !readSet.has(a.pageId) && !ctx.existingPageIds.has(a.pageId))
      .slice(0, targetSize)
      .map(article => {
        const info = unique.find(r => r.title === article.title);
        const curiosity = computeContextualCuriosity(article.title, article.excerpt, article.categories, decayed);
        return {
          article,
          score: 0.55 + curiosity * 0.15 + Math.random() * 0.10,
          source: 'category' as FeedSourceType,
          sourceDetail: info ? `Bridging ${info.pairLabel}` : 'Cross-topic discovery',
          positionIntent: 'stretch' as const,
          curiosityScore: curiosity,
          freshnessScore: computeFreshnessScore(article.fetchedAt),
        };
      });
  } catch (error) {
    console.error('[FeedAlgorithm] Bridge articles error:', error);
    return [];
  }
}

// ─── Exploration Pool ─────────────────────────────────────────

/**
 * Exploration pool: actively seek adjacent unexplored territory.
 * Targets categories with weight 0.05-0.15 that are adjacent to
 * high-weight categories via topicPairs or taxonomy proximity.
 * Creates the "didn't know I'd love this" moments.
 */
export async function fetchExplorationPool(
  ctx: FeedContext,
  targetSize: number,
  decayed: DecayedProfile
): Promise<FeedItem[]> {
  try {
    if (targetSize <= 0) return [];

    // Find "Goldilocks" categories: low weight but adjacent to high-weight ones
    const highWeightCats = Object.entries(decayed.decayedWeights)
      .filter(([, w]) => w >= 0.3)
      .map(([id]) => id);

    const lowWeightCats = Object.entries(decayed.decayedWeights)
      .filter(([, w]) => w >= 0.03 && w <= 0.15)
      .map(([id]) => id);

    if (highWeightCats.length === 0 || lowWeightCats.length === 0) return [];

    // Strategy 1: Use topicPairs to find co-occurring categories where one side is high
    const pairTargets: { catId: string; reason: string }[] = [];
    const topicPairs = ctx.profile.topicPairs || [];

    for (const pair of topicPairs) {
      if (pair.coCount < 2) continue;
      const aHigh = highWeightCats.includes(pair.catA);
      const bHigh = highWeightCats.includes(pair.catB);
      const aLow = lowWeightCats.includes(pair.catA);
      const bLow = lowWeightCats.includes(pair.catB);

      if (aHigh && bLow) {
        const highCat = getCategoryById(pair.catA);
        pairTargets.push({
          catId: pair.catB,
          reason: `People who like ${highCat?.name || pair.catA} also explore`,
        });
      } else if (bHigh && aLow) {
        const highCat = getCategoryById(pair.catB);
        pairTargets.push({
          catId: pair.catA,
          reason: `People who like ${highCat?.name || pair.catB} also explore`,
        });
      }
    }

    // Strategy 2: Random low-weight categories as fallback
    if (pairTargets.length < 2) {
      for (const lowId of lowWeightCats.sort(() => Math.random() - 0.5).slice(0, 3)) {
        if (!pairTargets.some(p => p.catId === lowId)) {
          pairTargets.push({ catId: lowId, reason: 'Explore' });
        }
      }
    }

    // Shuffle and pick top targets
    const shuffled = pairTargets.sort(() => Math.random() - 0.5).slice(0, 3);

    const allTitles: { title: string; catId: string; reason: string }[] = [];

    await Promise.all(
      shuffled.map(async ({ catId, reason }) => {
        const cat = getCategoryById(catId);
        if (!cat) return;
        const wikiCat = cat.wikiCategories[Math.floor(Math.random() * cat.wikiCategories.length)];
        const members = await getCategoryMembers(wikiCat, 6);
        for (const m of members) {
          if (!ctx.existingPageIds.has(m.pageId)) {
            allTitles.push({
              title: m.title,
              catId,
              reason: `${reason} ${cat.name}`,
            });
          }
        }
      })
    );

    if (allTitles.length === 0) return [];

    const articles = await batchGetSummaries(
      allTitles.slice(0, targetSize + 3).map(t => t.title)
    );

    return articles
      .filter(a => !ctx.existingPageIds.has(a.pageId) && a.excerpt.length >= 80)
      .slice(0, targetSize)
      .map(article => {
        const info = allTitles.find(t => t.title === article.title);
        const curiosity = computeContextualCuriosity(
          article.title, article.excerpt, article.categories, decayed
        );
        return {
          article,
          score: 0.35 + curiosity * 0.20 + Math.random() * 0.10,
          source: 'exploration' as FeedSourceType,
          sourceDetail: info?.reason || 'Explore something new',
          curiosityScore: curiosity,
          freshnessScore: computeFreshnessScore(article.fetchedAt),
        };
      });
  } catch (error) {
    console.error('[FeedAlgorithm] Exploration pool error:', error);
    return [];
  }
}
