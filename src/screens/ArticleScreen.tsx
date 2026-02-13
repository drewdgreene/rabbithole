import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { useEffectiveColorScheme } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { SaveToNotebookModal } from '../components/SaveToNotebookModal';
import { getArticleMobileHtml, getArticleSummary, getArticleLinks, extractSeeAlsoLinks } from '../services/wikipedia';
import { KeepGoingCards } from '../components/KeepGoingCards';
import { useInterestStore } from '../store/interestStore';
import { useArticleStore } from '../store/articleStore';
import { useNotebookStore } from '../store/notebookStore';
import { useSessionStore } from '../store/sessionStore';
import { useHistoryStore } from '../store/historyStore';
import { mapWikiCategoriesToTaxonomy } from '../utils/categoryMapping';
import { estimateReadTime } from '../utils/readTime';
import { MotiView } from 'moti';
import { ImageViewer } from '../components/ImageViewer';
import { isWeb } from '../utils/platform';
import { useTabStore } from '../store/tabStore';
import type { Article, FeedSourceType } from '../types';

// Extracted sub-modules
import { getArticleCSS } from './article/articleStyling';
import { ArticleHero } from './article/ArticleHero';
import { WebArticleRenderer, MobileArticleRenderer } from './article/ArticleRenderers';

// ─── Source Labels (matches FeedCard) ────────────────────────────

const SOURCE_LABELS: Record<string, { color: string; label: string }> = {
  category:       { color: '#6B4226', label: 'Topic' },
  link:           { color: '#2E7D6F', label: 'Related' },
  current_events: { color: '#C75B4A', label: 'Trending' },
  discovery:      { color: '#8B7355', label: 'Discover' },
  momentum:       { color: '#D4A574', label: 'Keep Going' },
  continuation:   { color: '#5CC4B0', label: 'Continue' },
  exploration:    { color: '#7B68AE', label: 'Explore' },
};

// ─── Main Component ──────────────────────────────────────────────

export interface ArticleContentProps {
  pageId: number;
  title: string;
  source?: FeedSourceType;
  sourceDetail?: string;
  restoreScrollPct?: number;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
  pageId,
  title,
  source,
  sourceDetail,
  restoreScrollPct,
}) => {
  const colors = useThemeColors();
  const colorScheme = useEffectiveColorScheme();

  const { signalArticleOpened, signalArticleRead, signalDeepRead, signalLinkFollowed } = useInterestStore();
  const { cacheArticle, getArticle } = useArticleStore();
  const { isArticleSaved } = useNotebookStore();
  const { recordArticleRead, recordLinkFollowed } = useSessionStore();

  const [html, setHtml] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(getArticle(pageId) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const openTimeRef = useRef<number>(Date.now());
  const scrollDepthRef = useRef<number>(0);
  const [scrollDepth, setScrollDepth] = useState(restoreScrollPct || 0);
  const handleLinkPressRef = useRef<(url: string) => boolean>(() => false);
  const isDark = colorScheme === 'dark';
  const hasHeroImage = !!article?.thumbnailUrl;
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const heroCollapsedRef = useRef(false);

  // Derived data
  const mappedCategories = useMemo(
    () => mapWikiCategoriesToTaxonomy(article?.categories || []),
    [article?.categories]
  );
  const readTime = useMemo(
    () => html ? estimateReadTime(html.replace(/<[^>]*>/g, '')) : estimateReadTime(article?.excerpt || ''),
    [html, article?.excerpt]
  );
  const sourceInfo = SOURCE_LABELS[source || 'category'] || SOURCE_LABELS.category;

  // Load article data and HTML
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let art = article;
        if (!art) {
          const summary = await getArticleSummary(title);
          if (summary && !cancelled) {
            art = summary;
            setArticle(summary);
            cacheArticle(summary);
          }
        }

        const htmlContent = await getArticleMobileHtml(title);
        if (!cancelled) {
          if (htmlContent) {
            setHtml(htmlContent);

            // Extract See Also links from the HTML and merge onto article
            const seeAlso = extractSeeAlsoLinks(htmlContent);
            if (seeAlso.length > 0 && art) {
              const withSeeAlso = { ...art, seeAlsoLinks: seeAlso };
              art = withSeeAlso;
              setArticle(withSeeAlso);
              cacheArticle(withSeeAlso);
            }
          } else {
            setError('Failed to load article content');
          }
        }

        if (art && art.categories.length === 0) {
          const { categories } = await getArticleLinks(title, 1);
          if (!cancelled && categories.length > 0) {
            const updated = { ...art, categories };
            setArticle(updated);
            cacheArticle(updated);
          }
        }

        if (art && !cancelled) {
          // Update the tab with resolved article data (especially for link-followed articles with pageId: 0)
          const activeTabId = useTabStore.getState().activeTabId;
          useTabStore.getState().updateTabArticle(activeTabId, art.pageId, art.displayTitle, art.categories, art.thumbnailUrl);

          signalArticleOpened(art, source);
          useHistoryStore.getState().recordVisit({
            pageId: art.pageId,
            title: art.title,
            displayTitle: art.displayTitle,
            excerpt: art.excerpt,
            thumbnailUrl: art.thumbnailUrl,
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load article');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    openTimeRef.current = Date.now();
    load();

    return () => {
      cancelled = true;
      const timeSpent = Date.now() - openTimeRef.current;
      if (article && timeSpent > 3000) {
        const scrollDepth = scrollDepthRef.current;
        signalArticleRead(article, timeSpent, scrollDepth);
        recordArticleRead(article.pageId, article.title, article.categories, timeSpent, scrollDepth);

        if (timeSpent > 60000 && scrollDepth > 40) {
          signalDeepRead(article, timeSpent, scrollDepth);
        }

        useHistoryStore.getState().updateScrollPosition(article.pageId, scrollDepth);

        // Preserve scroll position in tab
        const activeTabId = useTabStore.getState().activeTabId;
        useTabStore.getState().updateScrollDepth(activeTabId, scrollDepth);
      }
    };
  }, [title, pageId]);

  // Handle Wikipedia link clicks
  const handleLinkPress = useCallback((url: string) => {
    const wikiMatch = url.match(/\/wiki\/([^#?]+)/);
    if (wikiMatch) {
      const linkedTitle = decodeURIComponent(wikiMatch[1].replace(/_/g, ' '));

      if (article) {
        signalLinkFollowed(article, linkedTitle);
        recordLinkFollowed(article.title);
      }

      useTabStore.getState().openArticleFromLink(
        0,
        linkedTitle,
        linkedTitle,
        'link',
        'Related article',
      );
      return true;
    }
    return false;
  }, [article, signalLinkFollowed, recordLinkFollowed]);

  // Keep ref current so the message listener avoids stale closures
  handleLinkPressRef.current = handleLinkPress;

  // Handle postMessage from iframe (both link clicks and scroll depth)
  useEffect(() => {
    if (!isWeb) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'scrollDepth' && typeof data.depth === 'number') {
          const newDepth = Math.max(scrollDepthRef.current, data.depth);
          scrollDepthRef.current = newDepth;
          setScrollDepth(newDepth);
        } else if (data.type === 'scrollY' && typeof data.y === 'number') {
          const shouldCollapse = data.y > 30;
          if (shouldCollapse !== heroCollapsedRef.current) {
            heroCollapsedRef.current = shouldCollapse;
            setHeroCollapsed(shouldCollapse);
          }
        } else if (data.type === 'link' && data.url) {
          handleLinkPressRef.current(data.url);
        } else if (data.type === 'imagePress' && data.url) {
          setViewerImageUrl(data.url);
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Build themed HTML
  const themedHtml = html
    ? `<!DOCTYPE html>
       <html style="background-color: ${isDark ? '#1A120B' : '#FAF6F0'};">
       <head>
         <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
         ${getArticleCSS(isDark)}
         <script>
           document.addEventListener('click', function(e) {
             // ─── Image tap: open in viewer ───
             var imgEl = e.target;
             while (imgEl && imgEl.tagName !== 'IMG') {
               imgEl = imgEl.parentElement;
             }
             if (imgEl && imgEl.tagName === 'IMG' && imgEl.src) {
               var rect = imgEl.getBoundingClientRect();
               if (rect.width >= 50 && rect.height >= 50) {
                 e.preventDefault();
                 e.stopPropagation();
                 var imgSrc = imgEl.src;
                 if (imgSrc.indexOf('//') === 0) imgSrc = 'https:' + imgSrc;
                 var imgMsg = JSON.stringify({ type: 'imagePress', url: imgSrc });
                 if (window.ReactNativeWebView) {
                   window.ReactNativeWebView.postMessage(imgMsg);
                 } else {
                   window.parent.postMessage(imgMsg, '*');
                 }
                 return;
               }
             }

             // ─── Link tap: navigate to article ───
             var target = e.target;
             while (target && target.tagName !== 'A') {
               target = target.parentElement;
             }
             if (target && target.tagName === 'A') {
               var href = target.getAttribute('href') || '';
               var articleTitle = null;

               // Pattern 1: /wiki/Title (absolute path links)
               var wikiIdx = href.indexOf('/wiki/');
               if (wikiIdx !== -1) {
                 articleTitle = href.substring(wikiIdx + 6);
               }
               // Pattern 2: ./Title (relative links from mobile-html API)
               else if (href.indexOf('./') === 0) {
                 articleTitle = href.substring(2);
               }

               if (!articleTitle) return;

               // Strip hash and query
               var hashPos = articleTitle.indexOf('#');
               if (hashPos !== -1) articleTitle = articleTitle.substring(0, hashPos);
               var queryPos = articleTitle.indexOf('?');
               if (queryPos !== -1) articleTitle = articleTitle.substring(0, queryPos);

               if (!articleTitle) return;
               // Skip namespace pages (Category:, File:, Wikipedia:, etc.)
               if (articleTitle.indexOf(':') !== -1) return;

               e.preventDefault();
               e.stopPropagation();
               var fullUrl = 'https://en.wikipedia.org/wiki/' + articleTitle;
               var msg = JSON.stringify({ type: 'link', url: fullUrl });
               if (window.ReactNativeWebView) {
                 window.ReactNativeWebView.postMessage(msg);
               } else {
                 window.parent.postMessage(msg, '*');
               }
             }
           });

           setInterval(function() {
             var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
             var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
             var clientHeight = document.documentElement.clientHeight || window.innerHeight;
             var maxScroll = scrollHeight - clientHeight;
             var depth = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
             var msg = JSON.stringify({ type: 'scrollDepth', depth: depth });
             if (window.ReactNativeWebView) {
               window.ReactNativeWebView.postMessage(msg);
             } else {
               window.parent.postMessage(msg, '*');
             }
           }, 5000);

           // Throttled scroll position for hero collapse (with trailing send)
           (function() {
             var lastSent = 0;
             var pendingTimer = null;
             function sendScrollY() {
               lastSent = Date.now();
               var y = document.documentElement.scrollTop || document.body.scrollTop;
               var msg = JSON.stringify({ type: 'scrollY', y: Math.round(y) });
               if (window.ReactNativeWebView) {
                 window.ReactNativeWebView.postMessage(msg);
               } else {
                 window.parent.postMessage(msg, '*');
               }
             }
             window.addEventListener('scroll', function() {
               var now = Date.now();
               if (now - lastSent > 100) {
                 sendScrollY();
               }
               if (pendingTimer) clearTimeout(pendingTimer);
               pendingTimer = setTimeout(sendScrollY, 150);
             }, { passive: true });
           })();

           ${restoreScrollPct && restoreScrollPct > 0 ? `
           (function() {
             function restoreScroll() {
               var scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
               var clientHeight = document.documentElement.clientHeight || window.innerHeight;
               var maxScroll = scrollHeight - clientHeight;
               if (maxScroll > 0) {
                 var target = Math.round((${restoreScrollPct} / 100) * maxScroll);
                 window.scrollTo({ top: target, behavior: 'smooth' });
               }
             }
             if (document.readyState === 'complete') {
               setTimeout(restoreScroll, 500);
             } else {
               window.addEventListener('load', function() {
                 setTimeout(restoreScroll, 500);
               });
             }
           })();
           ` : ''}
         </script>
       </head>
       <body style="background-color: ${isDark ? '#1A120B' : '#FAF6F0'};">
         ${html}
       </body>
       </html>`
    : null;

  // ─── Loading State ───
  if (loading) {
    return (
      <ScreenContainer backgroundColor={colors.background}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <CompactHeader
            colors={colors}
            onBack={() => useTabStore.getState().goToParent()}
            onSave={() => setShowSaveModal(true)}
            isSaved={false}
          />
          <View style={styles.loadingContainer}>
            {/* Skeleton hero */}
            <View style={[styles.skeletonImage, { backgroundColor: colors.backgroundSecondary }]} />
            <View style={styles.skeletonMeta}>
              <View style={[styles.skeletonTitle, { backgroundColor: colors.backgroundSecondary }]} />
              <View style={[styles.skeletonSubtitle, { backgroundColor: colors.backgroundSecondary }]} />
            </View>
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.lg }} />
          </View>
        </SafeAreaView>
      </ScreenContainer>
    );
  }

  // ─── Error State ───
  if (error || !themedHtml) {
    return (
      <ScreenContainer backgroundColor={colors.background}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <CompactHeader
            colors={colors}
            onBack={() => useTabStore.getState().goToParent()}
            onSave={() => {}}
            isSaved={false}
          />
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color={colors.textTertiary} />
            <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
              Article not found
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error || 'Could not load this article'}
            </Text>
            <Pressable
              onPress={() => useTabStore.getState().goToParent()}
              style={[styles.errorBackButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.errorBackText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ScreenContainer>
    );
  }

  // ─── Main Article View ───
  return (
    <ScreenContainer backgroundColor={colors.background}>
      <View style={styles.safeArea}>
        {/* Floating header over hero */}
        <CompactHeader
          colors={colors}
          onBack={() => useTabStore.getState().goToParent()}
          onSave={() => setShowSaveModal(true)}
          isSaved={article ? isArticleSaved(article.pageId) : false}
          floating
          topInset={insets.top}
        />

        {/* Entrance animation: hero + content fade-slide in together */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 170, mass: 0.9 }}
          style={{ flex: 1, minHeight: 0 }}
        >
          {/* Native Hero — image bleeds to screen top */}
          <ArticleHero
            article={article}
            title={article?.displayTitle || title}
            source={source}
            sourceDetail={sourceDetail}
            sourceInfo={sourceInfo}
            readTime={readTime}
            scrollDepth={scrollDepth}
            categories={mappedCategories}
            colors={colors}
            topInset={insets.top}
            onImagePress={setViewerImageUrl}
            collapsed={heroCollapsed && hasHeroImage}
          />

          {/* Article WebView */}
          {isWeb ? (
            <WebArticleRenderer html={themedHtml} onLinkPress={handleLinkPress} />
          ) : (
            <MobileArticleRenderer
              html={themedHtml}
              onLinkPress={handleLinkPress}
              onScrollDepth={(depth: number) => {
                const newDepth = Math.max(scrollDepthRef.current, depth);
                scrollDepthRef.current = newDepth;
                setScrollDepth(newDepth);
              }}
              onScrollY={(y: number) => {
                const shouldCollapse = y > 30;
                if (shouldCollapse !== heroCollapsedRef.current) {
                  heroCollapsedRef.current = shouldCollapse;
                  setHeroCollapsed(shouldCollapse);
                }
              }}
              onImagePress={setViewerImageUrl}
              bgColor={isDark ? '#1A120B' : '#FAF6F0'}
            />
          )}
        </MotiView>

        {/* KeepGoingCards — appears when user has scrolled 70%+ */}
        {article && (
          <KeepGoingCards
            article={article}
            visible={scrollDepth >= 70}
          />
        )}

        {article && (
          <SaveToNotebookModal
            visible={showSaveModal}
            article={article}
            onClose={() => setShowSaveModal(false)}
          />
        )}

        <ImageViewer
          visible={!!viewerImageUrl}
          imageUrl={viewerImageUrl || ''}
          onClose={() => setViewerImageUrl(null)}
        />
      </View>
    </ScreenContainer>
  );
};

// ─── CompactHeader (kept inline — small, tightly coupled to ArticleContent) ──

function CompactHeader({
  colors,
  onBack,
  onSave,
  isSaved,
  floating,
  topInset,
}: {
  colors: any;
  onBack: () => void;
  onSave: () => void;
  isSaved: boolean;
  floating?: boolean;
  topInset?: number;
}) {
  return (
    <View
      style={[
        styles.compactHeader,
        floating && {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          paddingTop: (topInset || 0) + spacing.xs,
        },
      ]}
    >
      <Pressable
        onPress={onBack}
        style={[styles.compactBtn, { backgroundColor: colors.surface + 'DD' }]}
        hitSlop={8}
      >
        <Feather name="arrow-left" size={20} color={colors.primary} />
      </Pressable>
      <Pressable
        onPress={onSave}
        style={[styles.compactBtn, { backgroundColor: colors.surface + 'DD' }]}
        hitSlop={8}
      >
        <Feather
          name={isSaved ? 'check-circle' : 'bookmark'}
          size={20}
          color={isSaved ? colors.success : colors.primary}
        />
      </Pressable>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // Compact header
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    zIndex: 10,
  },
  compactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading skeleton
  loadingContainer: {
    flex: 1,
    padding: spacing.md,
  },
  skeletonImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.xl,
  },
  skeletonMeta: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  skeletonTitle: {
    width: '80%',
    height: 24,
    borderRadius: borderRadius.md,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 16,
    borderRadius: borderRadius.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 300,
  },
  errorBackButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    marginTop: spacing.md,
  },
  errorBackText: {
    color: '#FFFDF9',
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
  },
});
