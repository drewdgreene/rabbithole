import { Platform } from 'react-native';
import type { Article } from '../types';

const BASE_URL = 'https://en.wikipedia.org';
const REST_API = `${BASE_URL}/api/rest_v1`;
const ACTION_API = `${BASE_URL}/w/api.php`;
const USER_AGENT = 'RabbitHoleApp/1.0 (https://github.com/rabbithole; drew@rabbithole.app)';

// Concurrent throttle: allows up to MAX_CONCURRENT requests with 50ms stagger
const THROTTLE_MS = 50;
const MAX_CONCURRENT = 4;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    requestQueue.push(resolve);
  });
}

function releaseSlot(): void {
  if (requestQueue.length > 0) {
    const next = requestQueue.shift()!;
    next();
  } else {
    activeRequests--;
  }
}

async function throttledFetch(url: string, acceptHtml = false): Promise<Response> {
  await acquireSlot();

  try {
    await new Promise(resolve => setTimeout(resolve, THROTTLE_MS));

    const headers: Record<string, string> = {
      'Accept': acceptHtml ? 'text/html' : 'application/json',
    };
    if (Platform.OS !== 'web') {
      headers['User-Agent'] = USER_AGENT;
    }

    return await fetch(url, { headers });
  } finally {
    releaseSlot();
  }
}

/**
 * Strip HTML tags from a string (e.g. Wikipedia's displaytitle field)
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Ensure a URL has an explicit protocol.
 * Wikipedia often returns protocol-relative URLs (//upload.wikimedia.org/...)
 * which work in browsers but fail on mobile (expo-image needs https://).
 */
function normalizeUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}

/**
 * Scale a Wikipedia thumbnail URL to a desired width.
 * Thumbnail URLs contain /NNNpx- which we replace with the desired width.
 */
function scaleThumbnailUrl(url: string, desiredWidth: number): string {
  return normalizeUrl(url.replace(/\/\d+px-/, `/${desiredWidth}px-`));
}

/**
 * Get article summary (title, excerpt, thumbnail) from Wikipedia REST API
 */
export async function getArticleSummary(title: string): Promise<Article | null> {
  try {
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
    const response = await throttledFetch(`${REST_API}/page/summary/${encodedTitle}`);
    if (!response.ok) return null;

    const data = await response.json();

    return {
      pageId: data.pageid,
      title: data.title,
      displayTitle: stripHtml(data.displaytitle || data.title).replace(/\s*\([^)]*\)\s*$/, ''),
      excerpt: data.extract || '',
      thumbnailUrl: data.thumbnail?.source
        ? scaleThumbnailUrl(data.thumbnail.source, 320)
        : undefined,
      categories: [], // Summary endpoint doesn't include categories
      contentUrl: data.content_urls?.mobile?.page || `${BASE_URL}/wiki/${encodedTitle}`,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error('[Wikipedia] Failed to get summary for:', title, error);
    return null;
  }
}

/**
 * Get members of a Wikipedia category using the Action API
 */
export async function getCategoryMembers(
  category: string,
  limit: number = 20
): Promise<{ title: string; pageId: number }[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmtype: 'page',
      cmlimit: String(limit),
      format: 'json',
      origin: '*',
    });

    const response = await throttledFetch(`${ACTION_API}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    const members = data.query?.categorymembers || [];

    return members.map((m: any) => ({
      title: m.title,
      pageId: m.pageid,
    }));
  } catch (error) {
    console.error('[Wikipedia] Failed to get category members for:', category, error);
    return [];
  }
}

/**
 * Get subcategories of a Wikipedia category
 * Used by Topics screen for drill-down exploration
 */
export async function getWikiSubcategories(
  category: string,
  limit: number = 50
): Promise<{ name: string; wikiCategory: string }[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category}`,
      cmtype: 'subcat',
      cmlimit: String(limit),
      format: 'json',
      origin: '*',
    });

    const response = await throttledFetch(`${ACTION_API}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    const members = data.query?.categorymembers || [];

    return members.map((m: any) => {
      const raw = m.title.replace(/^Category:/, '');
      return {
        name: raw.replace(/_/g, ' '),
        wikiCategory: raw,
      };
    });
  } catch (error) {
    console.error('[Wikipedia] Failed to get subcategories for:', category, error);
    return [];
  }
}

/**
 * Get outgoing links and categories for an article
 * Used by the "rabbit hole" link pool in feed algorithm
 */
export async function getArticleLinks(
  title: string,
  limit: number = 50
): Promise<{ links: string[]; categories: string[] }> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'links|categories',
      pllimit: String(limit),
      plnamespace: '0', // Main namespace only
      cllimit: '20',
      clshow: '!hidden',
      format: 'json',
      origin: '*',
    });

    const response = await throttledFetch(`${ACTION_API}?${params}`);
    if (!response.ok) return { links: [], categories: [] };

    const data = await response.json();
    const pages = data.query?.pages || {};
    const page = Object.values(pages)[0] as any;

    if (!page) return { links: [], categories: [] };

    const links = (page.links || []).map((l: any) => l.title as string);
    const categories = (page.categories || [])
      .map((c: any) => (c.title as string).replace('Category:', ''));

    return { links, categories };
  } catch (error) {
    console.error('[Wikipedia] Failed to get links for:', title, error);
    return { links: [], categories: [] };
  }
}

/**
 * Get mobile-optimized HTML for article rendering
 */
export async function getArticleMobileHtml(title: string): Promise<string | null> {
  try {
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
    const response = await throttledFetch(`${REST_API}/page/mobile-html/${encodedTitle}`, true);
    if (!response.ok) return null;
    return await response.text();
  } catch (error) {
    console.error('[Wikipedia] Failed to get mobile HTML for:', title, error);
    return null;
  }
}

/**
 * Extract "See also" link titles from Wikipedia mobile-HTML.
 * Mobile-HTML uses <section data-mw-section-id> with headings.
 * Returns an ordered array of article titles from the "See also" section.
 */
export function extractSeeAlsoLinks(html: string): string[] {
  const titles: string[] = [];

  // Match each <section> block with its content
  const sectionPattern = /<section[^>]*data-mw-section-id="[^"]*"[^>]*>([\s\S]*?)<\/section>/gi;
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = sectionPattern.exec(html)) !== null) {
    const sectionContent = sectionMatch[1];
    // Check if this section contains a "See also" heading
    if (!/See\s+also/i.test(sectionContent)) continue;
    // Verify it's actually a heading, not just body text mentioning "see also"
    if (!/<h[23][^>]*>.*?See\s+also.*?<\/h[23]>/i.test(sectionContent)) continue;

    // Extract all article links from this section
    // Mobile-HTML links: href="./Title" or href="/wiki/Title"
    const linkPattern = /<a[^>]*href=["'](?:\.\/|\/wiki\/)([^"'#?]+)["'][^>]*>/gi;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkPattern.exec(sectionContent)) !== null) {
      const rawTitle = linkMatch[1];
      // Skip namespace pages (Category:, File:, Wikipedia:, etc.)
      if (rawTitle.includes(':')) continue;
      const decoded = decodeURIComponent(rawTitle.replace(/_/g, ' '));
      if (decoded && !titles.includes(decoded)) {
        titles.push(decoded);
      }
    }
    break; // Only process the first "See also" section
  }

  return titles;
}

/**
 * Get today's featured content (most-read articles + news)
 * Used by the "current events" pool in feed algorithm
 */
export async function getFeaturedContent(): Promise<{
  tfa?: { title: string; pageId: number; extract?: string; thumbnail?: string };
  mostRead: { title: string; pageId: number; views: number; extract?: string; thumbnail?: string }[];
  news: { title: string; pageId: number; extract?: string; thumbnail?: string }[];
}> {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const response = await throttledFetch(
      `${REST_API}/feed/featured/${year}/${month}/${day}`
    );
    if (!response.ok) return { mostRead: [], news: [] };

    const data = await response.json();

    // Today's featured article
    const tfa = data.tfa ? {
      title: data.tfa.title as string,
      pageId: data.tfa.pageid as number,
      extract: data.tfa.extract as string | undefined,
      thumbnail: data.tfa.thumbnail?.source
        ? scaleThumbnailUrl(data.tfa.thumbnail.source, 320)
        : undefined,
    } : undefined;

    const mostRead = (data.mostread?.articles || []).map((a: any) => ({
      title: a.title,
      pageId: a.pageid,
      views: a.views || 0,
      extract: a.extract,
      thumbnail: a.thumbnail?.source ? scaleThumbnailUrl(a.thumbnail.source, 320) : undefined,
    }));

    const news = (data.news || []).flatMap((n: any) =>
      (n.links || []).map((link: any) => ({
        title: link.title,
        pageId: link.pageid,
        extract: link.extract,
        thumbnail: link.thumbnail?.source ? scaleThumbnailUrl(link.thumbnail.source, 320) : undefined,
      }))
    );

    return { tfa, mostRead, news };
  } catch (error) {
    console.error('[Wikipedia] Failed to get featured content:', error);
    return { mostRead: [], news: [] };
  }
}

/**
 * Search articles by query text
 */
export async function searchArticles(
  query: string,
  limit: number = 20
): Promise<{ title: string; pageId: number; excerpt: string; thumbnail?: string }[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: String(limit),
      srprop: 'snippet',
      format: 'json',
      origin: '*',
    });

    const response = await throttledFetch(`${ACTION_API}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    const results = data.query?.search || [];

    return results.map((r: any) => ({
      title: r.title,
      pageId: r.pageid,
      excerpt: r.snippet?.replace(/<[^>]*>/g, '') || '',
    }));
  } catch (error) {
    console.error('[Wikipedia] Failed to search articles:', query, error);
    return [];
  }
}

/**
 * Get random articles from Wikipedia
 * Used by the "discovery" pool in feed algorithm
 */
export async function getRandomArticles(limit: number = 10): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'random',
      rnlimit: String(limit),
      rnnamespace: '0',
      format: 'json',
      origin: '*',
    });

    const response = await throttledFetch(`${ACTION_API}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    return (data.query?.random || []).map((r: any) => r.title as string);
  } catch (error) {
    console.error('[Wikipedia] Failed to get random articles:', error);
    return [];
  }
}

/**
 * Batch-fetch summaries for multiple titles using the Action API.
 * Fetches up to 50 titles per call with extracts + thumbnails in one request.
 */
export async function batchGetSummaries(titles: string[]): Promise<Article[]> {
  const articles: Article[] = [];

  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    try {
      const params = new URLSearchParams({
        action: 'query',
        titles: chunk.join('|'),
        prop: 'extracts|pageimages|info',
        exintro: '1',
        explaintext: '1',
        piprop: 'thumbnail',
        pithumbsize: '320',
        inprop: 'url|displaytitle',
        format: 'json',
        origin: '*',
      });

      const response = await throttledFetch(`${ACTION_API}?${params}`);
      if (!response.ok) continue;

      const data = await response.json();
      const pages = data.query?.pages || {};

      for (const page of Object.values(pages) as any[]) {
        if (!page.pageid || page.missing !== undefined) continue;

        // Skip articles with non-alphanumeric titles (e.g. "?" — a film)
        const baseTitle = page.title.replace(/\s*\(.*\)$/, '');
        if (!/[a-zA-Z0-9]/.test(baseTitle)) continue;

        const displayTitle = stripHtml(page.displaytitle || page.title)
          .replace(/\s*\([^)]*\)\s*$/, ''); // Strip disambiguation: "(2011 film)"

        articles.push({
          pageId: page.pageid,
          title: page.title,
          displayTitle,
          excerpt: page.extract || '',
          thumbnailUrl: page.thumbnail?.source ? normalizeUrl(page.thumbnail.source) : undefined,
          categories: [],
          contentUrl: page.fullurl || `${BASE_URL}/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
          fetchedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('[Wikipedia] Batch summary fetch failed:', error);
    }
  }

  return articles;
}
