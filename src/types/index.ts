// Article as fetched from Wikipedia
export interface Article {
  pageId: number;
  title: string;
  displayTitle: string;
  excerpt: string;
  thumbnailUrl?: string;
  categories: string[];
  contentUrl: string;
  fetchedAt: number;
  seeAlsoLinks?: string[]; // Curated related article titles from Wikipedia "See also" section
}

// Feed source pool types
export type FeedSourceType = 'category' | 'link' | 'current_events' | 'discovery' | 'momentum' | 'continuation' | 'search' | 'exploration';

// Feed item with ranking metadata
export interface FeedItem {
  article: Article;
  score: number;
  source: FeedSourceType;
  sourceDetail?: string;
  positionIntent?: 'hook' | 'comfort' | 'stretch' | 'surprise' | 'momentum';
  curiosityScore?: number;
  freshnessScore?: number;
  optimizedExcerpt?: string;
  tone?: 'dramatic' | 'mysterious' | 'biographical' | 'scientific' | 'lighthearted' | 'neutral';
  cardVariant?: 'standard' | 'fact' | 'thread' | 'trending' | 'bridge' | 'quote';
  readTimeMin?: number;
  contextCopy?: string; // Micro-copy: "3 min read", "Deep in your rabbit hole", etc.
}

// Curiosity hook styles — psychological trigger types
export type CuriosityStyle = 'scarcity' | 'mystery' | 'superlative' | 'conflict' | 'contrast' | 'number';

// A curated hook used during onboarding
export interface CuriosityHook {
  id: string;
  claim: string;
  categoryId: string;
  subcategoryId: string;
  curiosityStyle: CuriosityStyle;
}

// User interest profile (persisted)
export interface InterestProfile {
  categoryWeights: Record<string, number>; // 0.0-1.0
  readHistory: string[]; // pageId strings, ordered
  engagementLog: EngagementEntry[];
  lastUpdated: number;
  // Enhanced algorithm fields (optional for backward compat)
  sourceEngagement?: Record<string, { shown: number; opened: number; readDeep: number }>;
  topicPairs?: TopicPair[];
  lastSessionSummary?: SessionSummary;
  profileVersion?: number;
  searchHistory?: SearchHistoryEntry[];
  curiosityStylePreferences?: Record<CuriosityStyle, number>;
  // Persistent algorithmic state (survives app restarts)
  dismissedArticles?: number[];              // pageIds shown but not opened, FIFO max 1000
  persistedCategorySkips?: Record<string, number>;  // cumulative skip counts per category ID
  totalFeedGenerations?: number;             // lifetime feed generation count (for cold start)
}

// Search intent tracking
export interface SearchHistoryEntry {
  query: string;
  timestamp: number;
  tappedTitle?: string; // set if user tapped a result
}

export interface EngagementEntry {
  pageId: number;
  title: string;
  categories: string[];
  action: 'opened' | 'read' | 'saved' | 'link_followed' | 'scrolled_past' | 'card_visible' | 'deep_read' | 'search_query' | 'search_result_tap' | 'path_saved' | 'path_revisited';
  timeSpentMs?: number;
  timestamp: number;
  // Enhanced signal fields (optional for backward compat)
  scrollDepthPct?: number;
  cardDwellMs?: number;
  sourcePool?: FeedSourceType;
  sessionId?: string;
  isReread?: boolean;
  searchQuery?: string;
  trailDepth?: number;
}

// Topic co-occurrence tracking
export interface TopicPair {
  catA: string;
  catB: string;
  coCount: number;
  lastSeen: number;
}

// Session summary (persisted between sessions for return hooks)
export interface SessionSummary {
  sessionId: string;
  startedAt: number;
  endedAt: number;
  articlesRead: number;
  articlesSaved: number;
  deepReadPageIds: number[];
  topCategories: string[];
  unfinishedThreads: UnfinishedThread[];
}

export interface UnfinishedThread {
  seedPageId: number;
  seedTitle: string;
  categoryId: string;
  depth: number;
  lastArticleTitle: string;
}

// Context passed to feed algorithm
export interface FeedContext {
  mode: 'initial' | 'refresh' | 'load_more' | 'post_read';
  session: SessionSnapshot;
  profile: InterestProfile;
  existingPageIds: Set<number>;
  hourOfDay: number;
  daysSinceLastSession: number;
  previousSessionSummary: SessionSummary | null;
  recentSavedTitles: string[];
}

// Ephemeral session state snapshot
export interface SessionSnapshot {
  sessionId: string;
  startedAt: number;
  articlesOpenedThisSession: number;
  articlesReadThisSession: number;
  articlesSavedThisSession: number;
  lastReadArticle: { pageId: number; title: string; categories: string[] } | null;
  lastReadAt: number | null;
  categoryCountsThisSession: Record<string, number>;
  consecutiveSameTopic: number;
  currentTopicStreak: string | null;
  deepReadCount: number;
  threadDepth: number;
  threadSeedTitle: string | null;
  feedGenerationCount: number;
  lastSearchQuery: string | null;
  // Flow state detection
  isInFlowState: boolean;
  engagementVelocity: number; // articles per 10-min window
  avgRecentScrollDepth: number;
  // Category suppression
  suppressedCategories: string[]; // categories with 3+ consecutive skips
  shownNotOpened: number[]; // pageIds shown but never tapped this session
}

// Category taxonomy
export interface Category {
  id: string;
  name: string;
  iconName: string; // Feather icon name (e.g. 'activity', 'globe')
  wikiCategories: string[]; // Wikipedia category names
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  wikiCategories: string[]; // Wikipedia category names
}

// Notebook for saved articles
export interface Notebook {
  id: string;
  name: string;
  articleIds: number[];
  createdAt: number;
  updatedAt: number;
}

export interface SavedArticle {
  pageId: number;
  title: string;
  displayTitle: string;
  excerpt: string;
  thumbnailUrl?: string;
  savedAt: number;
  notebookIds: string[];
  categories: string[];
}

// History entry for a previously viewed article
export interface HistoryEntry {
  pageId: number;
  title: string;
  displayTitle: string;
  excerpt: string;
  thumbnailUrl?: string;
  scrollDepthPct: number;    // 0-100, last scroll position for restoration
  lastViewedAt: number;      // timestamp of most recent open
  viewCount: number;
}

// Onboarding state
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

export interface OnboardingState {
  status: OnboardingStatus;
  selectedCategoryIds: string[];
  selectedSubcategoryIds: string[];
  currentStep: number;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  Browse: undefined;
  Topics: undefined;
  Notebooks: undefined;
  NotebookDetail: { notebookId: string };
  History: undefined;
  Settings: undefined;
};

// Path (saved tab tree) types
export interface Path {
  id: string;
  name: string;
  tabs: PathTab[];
  rootTitle: string;
  thumbnailUrl?: string;
  categories: string[];
  articleCount: number;
  maxDepth: number;
  createdAt: number;
  lastOpenedAt: number;
}

export interface PathTab {
  id: string;
  pageId: number;
  title: string;
  displayTitle: string;
  thumbnailUrl?: string;
  categories: string[];
  scrollDepthPct: number;
  parentId: string | null;
  childIds: string[];
  depth: number;
}

// Theme types
export type ThemeMode = 'system' | 'light' | 'dark';
