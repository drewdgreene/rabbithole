# RabbitHole

Feed-powered Wikipedia reader. TikTok-style scrolling for encyclopedia articles, with a 4-pool recommendation engine that learns your interests over time.

Fully client-side. No server, no auth, no accounts. Everything runs on-device.

## Stack

| Layer | Tech |
|---|---|
| Framework | Expo 54, React 19, React Native 0.81 |
| UI | Tamagui 1.144, Feather icons via `@expo/vector-icons` |
| State | Zustand 5 with AsyncStorage persistence |
| Navigation | React Navigation (native stack + drawer) |
| Data Source | Wikipedia REST API + Action API |
| Fonts | Google Sans Flex |
| Images | `expo-image` |
| Platforms | Web, Android (APK via Gradle), iOS |

## Quick Start

```bash
# Install dependencies
npm install

# Web (use port 8090 — port 8081 is taken by another project)
npx expo start --web --port 8090

# Android APK
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# iOS
npx expo run:ios
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── CategoryChip   # Selectable category pill (onboarding + settings)
│   ├── FeedCard       # Vertical article card with hero image + source badge
│   ├── SaveToNotebookModal  # Modal for saving articles to notebooks
│   ├── ScreenContainer      # Flex wrapper that fixes RN Web height issues
│   ├── SkeletonCard         # Animated loading placeholder matching FeedCard layout
│   └── WebLayoutWrapper     # Max-width centering wrapper for web
├── hooks/
│   ├── useFeedLoader  # Feed generation, refresh, infinite scroll
│   └── useResponsive  # Breakpoint detection (mobile/tablet/desktop)
├── navigation/
│   ├── AppNavigator           # Root: Onboarding → Main routing
│   ├── ResponsiveNavigator    # Desktop (>=1024px) → Drawer, else → Mobile stack
│   ├── MobileNavigator        # Stack: Feed, Article, Notebooks, NotebookDetail, Settings
│   └── DesktopDrawerNavigator # Permanent 240px sidebar + nested stacks
├── screens/
│   ├── FeedScreen           # FlatList of FeedCards with pull-to-refresh
│   ├── ArticleScreen        # Full article reader (iframe on web, WebView on native)
│   ├── OnboardingScreen     # Category + subcategory selection wizard
│   ├── NotebooksScreen      # Notebook list with create/rename/delete
│   ├── NotebookDetailScreen # Saved articles in a notebook
│   └── SettingsScreen       # Theme toggle, stats, data management
├── services/
│   ├── wikipedia      # All Wikipedia API calls (throttled, CORS-safe)
│   ├── feedAlgorithm  # 4-pool recommendation engine
│   └── categoryData   # 18 categories with subcategories + wiki category mappings
├── store/             # Zustand stores (all persisted to AsyncStorage)
│   ├── articleStore    # Article cache (max 200)
│   ├── feedStore       # Current feed items + loading state
│   ├── interestStore   # Interest profile with weighted categories + learning signals
│   ├── notebookStore   # Saved articles + notebook collections
│   ├── onboardingStore # Onboarding progress + selections
│   └── themeStore      # Theme mode (system/light/dark)
├── theme/
│   ├── colors     # Earthy palette: light (#FAF6F0) / dark (#1A120B)
│   ├── typography # Google Sans Flex with mobile/desktop size variants
│   ├── breakpoints # mobile(0), tablet(768), desktop(1024), wide(1440)
│   └── index      # useThemeColors(), spacing, borderRadius, shadows
├── types/
│   └── index      # All TypeScript interfaces and navigation param types
└── utils/
    ├── platform   # isWeb, isMobile, isAndroid, isIOS helpers
    └── shadows    # Cross-platform shadow conversion (boxShadow on web)
```

## Architecture

### Feed Algorithm

The feed generates articles from 4 pools, run in parallel:

| Pool | Share | Source | Score Range |
|---|---|---|---|
| **Category** | 40% (12 items) | Wikipedia categories weighted by user interests | 0.4 - 1.0 |
| **Link** | 30% (9 items) | Outgoing links from recently-read articles | 0.5 - 0.65 |
| **Current Events** | 20% (6 items) | Today's most-read + news, filtered by interest overlap | 0.3 - 0.7 |
| **Discovery** | 10% (3 items) | Random articles for serendipity | 0.1 - 0.25 |

Results are deduplicated, scored, and shuffled with slight jitter. Target: 30 items per generation, 15 per load-more.

### Interest Learning

The `interestStore` adjusts category weights based on user behavior signals:

| Signal | Weight Change | Trigger |
|---|---|---|
| Article opened | +0.05 | Navigating to ArticleScreen |
| Article read | +0.02 to +0.10 | Time-based (>3s on article, scales with duration) |
| Article saved | +0.15 | Saving to any notebook |
| Link followed | +0.08 | Tapping a Wikipedia link within an article |
| Scrolled past | -0.01 | Card leaves viewport without being tapped |

Category matching uses the article's Wikipedia categories cross-referenced against `categoryData.ts` mappings.

### Wikipedia API

All calls go through `throttledFetch()` with 200ms minimum spacing. Two APIs:

- **REST API** (`/api/rest_v1/`) — Article summaries, featured content, mobile HTML
- **Action API** (`/w/api.php`) — Category members, links, search, random. Uses `origin=*` for CORS.

The `User-Agent` header is only sent on native platforms. Browsers block it via CORS preflight. Thumbnail URLs are scaled to 640px via regex replacement of the `/NNNpx-` path segment.

### State Persistence

All Zustand stores persist to AsyncStorage with `@rabbithole:` key prefix:

| Store | Key(s) | Notes |
|---|---|---|
| themeStore | `@rabbithole:themeMode` | |
| onboardingStore | `@rabbithole:onboardingStatus`, `...Categories`, `...Subcategories` | |
| interestStore | `@rabbithole:interestProfile` | Max 500 history, 1000 log entries |
| articleStore | `@rabbithole:articleCache` | Max 200 articles, LRU eviction |
| notebookStore | `@rabbithole:notebooks`, `@rabbithole:savedArticles` | |
| feedStore | Not persisted | Regenerated on each session |

### Navigation

```
AppNavigator (root)
├── OnboardingScreen (if not completed)
└── ResponsiveNavigator
    ├── MobileNavigator (width < 1024)
    │   └── Stack: Feed → Article → Notebooks → NotebookDetail → Settings
    └── DesktopDrawerNavigator (width >= 1024)
        ├── FeedStack: FeedHome → Article
        ├── NotebooksStack: NotebooksHome → NotebookDetail → Article
        └── Settings
```

### Theme

Earthy encyclopedia palette with full light/dark support:

| Token | Light | Dark |
|---|---|---|
| primary | `#6B4226` (earth brown) | `#D4A574` (golden amber) |
| background | `#FAF6F0` (parchment) | `#1A120B` (deep tunnel) |
| textPrimary | `#2C1810` | `#EDE4D8` |
| link | `#2E7D6F` (deep teal) | `#5CC4B0` (bright teal) |

All colors accessed via `useThemeColors()` hook. No emojis anywhere — all icons are thin Feather line icons.

## Key Patterns

- **ScreenContainer** + **WebLayoutWrapper** fix RN Web flex height issues in iframes
- `web/index.html` has critical CSS overrides for RN Web `height: 100%` and custom scrollbar styling
- `react-native-reanimated/plugin` must be LAST in `babel.config.js` plugins array
- Zustand stores follow `create<State>((set, get) => ({...}))` pattern
- ArticleScreen renders via `<iframe srcDoc>` on web and `react-native-webview` on native, with injected CSS matching the earthy theme
- FeedCard uses a vertical layout: 180px hero image on top, text below, 6px colored dot for source type

## Category Data

18 categories, each with ~7 subcategories and mapped Wikipedia category names for API queries. Icons are Feather icon names:

Science (`activity`), History (`clock`), Technology (`cpu`), Philosophy (`compass`), Geography (`globe`), Arts (`feather`), Nature (`droplet`), Medicine (`heart`), Sports (`award`), Politics (`flag`), Economics (`trending-up`), Languages (`type`), Religion (`star`), Food & Drink (`coffee`), Space (`target`), Music (`music`), Mathematics (`hash`), Pop Culture (`film`)

## Gotchas

- **Port 8081 conflict**: Another project (NoteShimp/ChatDrive) uses 8081. Always use `--port 8090` for RabbitHole web dev.
- **CORS on web**: Wikipedia blocks custom `User-Agent` headers from browsers. The `throttledFetch` function conditionally omits it on web via `Platform.OS` check.
- **`displaytitle` HTML**: Wikipedia's REST API returns `displaytitle` with HTML tags (e.g., `<span class="mw-page-title-main">Title</span>`). These are stripped via `stripHtml()` before storing.
- **Feed auto-load timing**: `useFeedLoader` watches for `hasProfile` (category weights exist) to trigger initial load. This handles the case where FeedScreen mounts during onboarding before the profile is ready.
- **Android APK**: Run `npx expo prebuild --platform android --clean` before first Gradle build. The prebuild generates the `android/` directory.
- **Tamagui config**: `tamagui.config.ts` exists at project root but the app primarily uses RN StyleSheet + custom theme rather than Tamagui components.
