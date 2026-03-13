import type { FeedSourceType } from '../../types';

// ─── Tuning Constants ────────────────────────────────────────────

export const TUNING = {
  // Feed sizes
  fullFeedTarget: 30,
  loadMoreTarget: 15,

  // Temporal decay
  decayHalfLifeDays: 7,
  decayFloor: 0.02,

  // Momentum detection
  momentumRecentDays: 3,
  momentumBaselineDays: 7,
  surgingThreshold: 0.3,
  decliningThreshold: -0.3,

  // Curiosity scoring weights
  curiosity: {
    questionInTitle: 0.15,
    superlativeInTitle: 0.12,
    numbersOrLists: 0.08,
    mysteryWords: 0.15,
    conflictWords: 0.10,
    longExcerpt: 0.05,
    idealTitleLength: 0.05,
  },

  // Base pool allocation (sums to 1.0)
  basePools: {
    category: 0.30,
    link: 0.25,
    current_events: 0.15,
    discovery: 0.10,
    momentum: 0.10,
    continuation: 0.05,
    exploration: 0.05,
    search: 0, // search is not a pool — echoed through discovery
  } as Record<FeedSourceType, number>,

  // Pool allocation adjustments
  ctrInfluence: 0.15,           // Max shift from source CTR
  sessionDepthShift: 0.10,      // Shift toward discovery/momentum at depth
  sameTopicStreakThreshold: 3,   // Consecutive same-topic before variety injection
  varietyInjection: 0.10,       // Extra discovery allocation for variety
  morningCurrentEventsBoost: 0.10,
  nightDeepReadBoost: 0.10,
  returnContinuationBoost: 0.10,
  loadMoreMomentumBoost: 0.05,
  postReadMomentumBoost: 0.15,
  threadDepthLinkBoost: 0.15,
  threadDepthThreshold: 3,

  // Scoring components
  categoryScoring: {
    base: 0.30,
    weightFactor: 0.40,
    momentumMax: 0.10,
    curiosityFactor: 0.15,
    randomJitter: 0.05,
  },

  // Position arrangement
  hookPositions: [0, 1],
  comfortPositions: [2, 3, 4],
  surpriseInterval: { min: 5, max: 8 },
  maxConsecutiveSameSource: 2,
  maxConsecutiveSameCategory: 3,

  // Interleave scoring weights
  interleaveWeights: { score: 0.6, curiosity: 0.3, freshness: 0.1 },
};

// ─── Namespace Filtering ────────────────────────────────────────

const NAMESPACE_PREFIX = /^(Category|Wikipedia|Template|Help|Portal|Talk|Draft|File|Module|MediaWiki|User|Special):/i;

export function isNamespacePage(title: string): boolean {
  return NAMESPACE_PREFIX.test(title);
}

// ─── Link Filtering ─────────────────────────────────────────────

export const GENERIC_LINK_PATTERNS = [
  /^\d{3,4}$/,                                // Years: "1945", "2023"
  /^\d{1,2}(st|nd|rd|th)\s+century$/i,        // "21st century"
  /^(January|February|March|April|May|June|July|August|September|October|November|December)(\s+\d+)?$/i,
  /^List of /i,
  /^Index of /i,
  /^Outline of /i,
  /^(Category|Wikipedia|Template|Help|Portal|Talk|Draft):/i,
];

export const GENERIC_TITLES = new Set([
  'United States', 'United Kingdom', 'France', 'Germany', 'Japan', 'China',
  'India', 'Russia', 'Canada', 'Australia', 'Brazil', 'Italy', 'Spain',
  'Mexico', 'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Poland',
  'English language', 'Latin', 'Greek language', 'French language',
  'New York City', 'London', 'Paris', 'Tokyo', 'Berlin', 'Rome',
  'Los Angeles', 'Chicago', 'Washington, D.C.', 'San Francisco',
  'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania',
  'Atlantic Ocean', 'Pacific Ocean', 'Indian Ocean',
  'Earth', 'Sun', 'Moon',
  'DNA', 'Protein', 'Water', 'Carbon', 'Oxygen', 'Hydrogen',
  'University', 'College', 'School',
  // Broad taxonomy / overview articles
  'Health', 'Science', 'Technology', 'Art', 'Music', 'Religion', 'Philosophy',
  'Mathematics', 'Education', 'Law', 'Politics', 'Government', 'Economy',
  'History', 'Culture', 'Society', 'Language', 'Medicine', 'Engineering',
  'Agriculture', 'Sport', 'Sports', 'Food', 'Energy', 'Nature', 'Animal',
  'Plant', 'Human', 'Life', 'Death', 'Time', 'Space', 'Color', 'Sound',
  'Light', 'Love', 'War', 'Peace', 'Money', 'Trade', 'Industry', 'Film',
  'Television', 'Internet', 'Computer', 'Communication', 'Transport',
  'Weather', 'Climate', 'Geography', 'Biology', 'Chemistry', 'Physics',
  'Psychology', 'Sociology', 'Anthropology', 'Archaeology', 'Astronomy',
  'Geology', 'Ecology', 'Ethics', 'Logic', 'Aesthetics', 'Metaphysics',
  'Literature', 'Poetry', 'Dance', 'Theatre', 'Architecture', 'Design',
  'Photography', 'Sculpture', 'Painting', 'Drawing',
  // Broad verb/gerund concepts (activities, states, processes)
  'Eating', 'Drinking', 'Sleeping', 'Breathing', 'Walking', 'Running',
  'Swimming', 'Writing', 'Reading', 'Cooking', 'Hunting', 'Fishing',
  'Farming', 'Mining', 'Trading', 'Singing', 'Dancing', 'Playing',
  'Learning', 'Teaching', 'Thinking', 'Dreaming', 'Working', 'Traveling',
  'Building', 'Manufacturing', 'Advertising', 'Marketing', 'Banking',
  // Broad noun concepts missed by original list
  'Emotion', 'Intelligence', 'Consciousness', 'Knowledge', 'Belief',
  'Truth', 'Beauty', 'Justice', 'Freedom', 'Power', 'Wealth', 'Poverty',
  'Marriage', 'Family', 'Childhood', 'Adolescence', 'Aging',
  'Disease', 'Infection', 'Pain', 'Sleep', 'Nutrition', 'Diet',
  'Exercise', 'Hygiene', 'Clothing', 'Shelter', 'City', 'Village',
  'Country', 'Nation', 'State', 'Democracy', 'Capitalism', 'Socialism',
  'Communism', 'Fascism', 'Terrorism', 'Racism', 'Slavery',
  'Immigration', 'Globalization', 'Pollution', 'Recycling',
  'Electricity', 'Magnetism', 'Gravity', 'Radiation', 'Heat',
  'Pressure', 'Force', 'Motion', 'Velocity', 'Acceleration',
  'Atom', 'Molecule', 'Cell', 'Gene', 'Virus', 'Bacteria',
  'Fungus', 'Insect', 'Fish', 'Bird', 'Mammal', 'Reptile',
  'Tree', 'Flower', 'Grass', 'Fruit', 'Vegetable', 'Meat',
  'Bread', 'Rice', 'Wheat', 'Corn', 'Sugar', 'Salt', 'Oil',
  'Metal', 'Wood', 'Stone', 'Glass', 'Plastic', 'Paper',
  'Book', 'Newspaper', 'Magazine', 'Radio', 'Telephone',
  'Car', 'Train', 'Ship', 'Airplane', 'Bicycle', 'Road', 'Bridge',
  'River', 'Lake', 'Mountain', 'Desert', 'Forest', 'Island', 'Ocean',
  'Continent', 'Planet', 'Star', 'Galaxy', 'Universe',
  // Compound broad terms
  'Natural environment', 'Natural science', 'Social science', 'Political science',
  'Computer science', 'Information technology', 'Public health', 'Mental health',
  'Human rights', 'International law', 'Visual arts', 'Performing arts',
  'Fine arts', 'Martial arts', 'Classical music', 'Popular music',
  'World history', 'Ancient history', 'Modern history', 'Art history',
  'Natural history', 'Human body', 'Solar System', 'Milky Way',
  'Scientific method', 'Common law', 'Civil law', 'Criminal law',
]);

// Detect broad overview articles that make poor feed recommendations
export const DEFINITIONAL_PATTERN = /^(In general,|.{0,30}\b(is|was|are|were)\s+["\u201C]?(a|an|the|defined|considered|regarded)\b|.{0,30}\brefers?\s+to\b|.{0,30}\bcan be (defined|described)\b|.{0,30}\bis a term\b|.{0,30}\bis the (study|practice|process|act|state|concept)\b|.{0,30}\b(encompasses|comprises|includes|involves|denotes|covers)\b)/i;

export function isBroadOverviewArticle(title: string): boolean {
  return GENERIC_TITLES.has(title);
}

// ─── Curiosity Magnet Categories ────────────────────────────────

export const CURIOSITY_CATEGORIES = [
  'Unsolved_problems',
  'Paradoxes',
  'World_records',
  'Thought_experiments',
  'Coincidences',
  'Mysteries',
  'Misconceptions',
  'Urban_legends',
  'Unusual_deaths',
  'Hoaxes',
];

// ─── Tone Classification Patterns ───────────────────────────────

export const TONE_PATTERNS = {
  dramatic: /\b(death|dead|died|killed|murder|war|battle|invasion|disaster|catastrophe|destruction|massacre|assassination|explosion|crash|collapse|epidemic|plague|famine|genocide|tragedy|devastating|horrific)\b/i,
  mysterious: /\b(mystery|mysterious|unknown|unexplained|secret|hidden|lost|disappeared|unsolved|conspiracy|paradox|anomaly|enigma|controversial|forbidden|haunted|cursed|cryptid|legend|supernatural)\b/i,
  biographical: /\b(born|died|was a|is a|became|served as|career|childhood|grew up|married|family|autobiography|biography|legacy|pioneer|founder|inventor)\b/i,
  scientific: /\b(research|study|experiment|theory|hypothesis|molecule|equation|discovered|observation|evidence|species|genome|quantum|relativity|algorithm|theorem)\b/i,
  lighthearted: /\b(festival|game|comedy|cartoon|toy|joke|candy|holiday|celebration|fun|record|unusual|bizarre|quirky|trivia|mascot|nickname|tradition)\b/i,
};
