import type { CuriosityHook } from '../types';

/**
 * ~70 curated curiosity hooks for the onboarding screen.
 * Each hook is a punchy, factually accurate claim designed to spark interest.
 */
export const CURIOSITY_HOOKS: CuriosityHook[] = [
  // ─── SCIENCE (high-appeal: 2 per subcat where possible) ───────────────

  {
    id: 'hook-physics-01',
    claim: 'A teaspoon of neutron star weighs about 6 billion tons',
    categoryId: 'science',
    subcategoryId: 'physics',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-physics-02',
    claim: 'Time passes measurably faster on your head than at your feet',
    categoryId: 'science',
    subcategoryId: 'physics',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-chemistry-01',
    claim: 'There is enough gold dissolved in the oceans to give every person 9 pounds',
    categoryId: 'science',
    subcategoryId: 'chemistry',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-biology-01',
    claim: 'Your body replaces roughly 330 billion cells every single day',
    categoryId: 'science',
    subcategoryId: 'biology',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-biology-02',
    claim: 'Tardigrades survive the vacuum of space without any protection',
    categoryId: 'science',
    subcategoryId: 'biology',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-neuroscience-01',
    claim: 'Your brain uses the same amount of power as a 20-watt light bulb',
    categoryId: 'science',
    subcategoryId: 'neuroscience',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-paleontology-01',
    claim: 'T. rex lived closer in time to humans than to Stegosaurus',
    categoryId: 'science',
    subcategoryId: 'paleontology',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-ecology-01',
    claim: 'A single fungal network beneath a forest can span thousands of acres',
    categoryId: 'science',
    subcategoryId: 'ecology',
    curiosityStyle: 'superlative',
  },

  // ─── HISTORY (high-appeal) ────────────────────────────────────────────

  {
    id: 'hook-ancient-history-01',
    claim: 'Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid',
    categoryId: 'history',
    subcategoryId: 'ancient-history',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-ancient-history-02',
    claim: 'The Library of Alexandria may have held over 400,000 scrolls',
    categoryId: 'history',
    subcategoryId: 'ancient-history',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-medieval-history-01',
    claim: 'Medieval knights sometimes settled legal disputes with judicial combat',
    categoryId: 'history',
    subcategoryId: 'medieval-history',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-modern-history-01',
    claim: 'The last known widow of a Civil War veteran died in 2020',
    categoryId: 'history',
    subcategoryId: 'modern-history',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-military-history-01',
    claim: 'A single carrier pigeon saved 194 American soldiers in World War I',
    categoryId: 'history',
    subcategoryId: 'military-history',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-asian-history-01',
    claim: 'The Mongol Empire once controlled 24% of the world\'s total land area',
    categoryId: 'history',
    subcategoryId: 'asian-history',
    curiosityStyle: 'superlative',
  },

  // ─── SPACE (high-appeal) ──────────────────────────────────────────────

  {
    id: 'hook-astronomy-01',
    claim: 'There are more stars in the universe than grains of sand on Earth',
    categoryId: 'space',
    subcategoryId: 'astronomy',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-solar-system-01',
    claim: 'A day on Venus lasts longer than a year on Venus',
    categoryId: 'space',
    subcategoryId: 'solar-system',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-solar-system-02',
    claim: 'Saturn is less dense than water — it would float in a giant bathtub',
    categoryId: 'space',
    subcategoryId: 'solar-system',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-space-exploration-01',
    claim: 'Voyager 1 is over 15 billion miles from Earth and still sending data',
    categoryId: 'space',
    subcategoryId: 'space-exploration',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-cosmology-01',
    claim: 'The observable universe is 93 billion light-years across',
    categoryId: 'space',
    subcategoryId: 'cosmology',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-astrobiology-01',
    claim: 'Scientists found amino acids on asteroids billions of years old',
    categoryId: 'space',
    subcategoryId: 'astrobiology',
    curiosityStyle: 'mystery',
  },

  // ─── NATURE (high-appeal) ─────────────────────────────────────────────

  {
    id: 'hook-animals-01',
    claim: 'Octopuses have three hearts and blue blood',
    categoryId: 'nature',
    subcategoryId: 'animals',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-animals-02',
    claim: 'Crows can recognize individual human faces for years',
    categoryId: 'nature',
    subcategoryId: 'animals',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-marine-life-01',
    claim: 'The immortal jellyfish can revert to its juvenile form to avoid death',
    categoryId: 'nature',
    subcategoryId: 'marine-life',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-marine-life-02',
    claim: 'Whale songs can travel over 10,000 miles through the ocean',
    categoryId: 'nature',
    subcategoryId: 'marine-life',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-insects-01',
    claim: 'A colony of ants can collectively solve problems no single ant understands',
    categoryId: 'nature',
    subcategoryId: 'insects',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-plants-01',
    claim: 'Trees send nutrients to sick neighbors through underground fungal networks',
    categoryId: 'nature',
    subcategoryId: 'plants',
    curiosityStyle: 'mystery',
  },

  // ─── TECHNOLOGY (high-appeal) ─────────────────────────────────────────

  {
    id: 'hook-computer-science-01',
    claim: 'The first computer bug was a literal moth trapped in a relay',
    categoryId: 'technology',
    subcategoryId: 'computer-science',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-artificial-intelligence-01',
    claim: 'GPT-class models compress the equivalent of trillions of words into weights',
    categoryId: 'technology',
    subcategoryId: 'artificial-intelligence',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-cybersecurity-01',
    claim: 'The most common password in the world is still "123456"',
    categoryId: 'technology',
    subcategoryId: 'cybersecurity',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-internet-01',
    claim: 'Over 90% of the internet is invisible to standard search engines',
    categoryId: 'technology',
    subcategoryId: 'internet',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-electronics-01',
    claim: 'Your smartphone has more computing power than all of NASA had in 1969',
    categoryId: 'technology',
    subcategoryId: 'electronics',
    curiosityStyle: 'contrast',
  },

  // ─── PSYCHOLOGY (high-appeal) ─────────────────────────────────────────

  {
    id: 'hook-cognitive-psychology-01',
    claim: 'Humans can only hold about 4 items in working memory at once',
    categoryId: 'psychology',
    subcategoryId: 'cognitive-psychology',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-social-psychology-01',
    claim: 'Strangers form a first impression of you in just 100 milliseconds',
    categoryId: 'psychology',
    subcategoryId: 'social-psychology',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-behavioral-economics-01',
    claim: 'People feel the pain of losing $100 twice as strongly as the joy of gaining $100',
    categoryId: 'psychology',
    subcategoryId: 'behavioral-economics',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-abnormal-psychology-01',
    claim: 'Some people are born completely unable to feel fear',
    categoryId: 'psychology',
    subcategoryId: 'abnormal-psychology',
    curiosityStyle: 'scarcity',
  },

  // ─── TRUE-CRIME (high-appeal) ─────────────────────────────────────────

  {
    id: 'hook-unsolved-cases-01',
    claim: 'The Zodiac Killer\'s 340 cipher went unsolved for 51 years',
    categoryId: 'true-crime',
    subcategoryId: 'unsolved-cases',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-heists-01',
    claim: 'The Isabella Stewart Gardner Museum heist remains unsolved after 35+ years',
    categoryId: 'true-crime',
    subcategoryId: 'heists',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-forensics-01',
    claim: 'Forensic genealogy has solved cold cases over 40 years old using DNA',
    categoryId: 'true-crime',
    subcategoryId: 'forensics',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-wrongful-convictions-01',
    claim: 'Over 3,000 wrongfully convicted people have been exonerated in the US since 1989',
    categoryId: 'true-crime',
    subcategoryId: 'wrongful-convictions',
    curiosityStyle: 'number',
  },

  // ─── MYTHOLOGY (high-appeal) ──────────────────────────────────────────

  {
    id: 'hook-greek-mythology-01',
    claim: 'Ancient Greeks believed the Oracle at Delphi inhaled volcanic gases to prophesy',
    categoryId: 'mythology',
    subcategoryId: 'greek-mythology',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-norse-mythology-01',
    claim: 'In Norse myth, the world is destined to end and be reborn in Ragnarok',
    categoryId: 'mythology',
    subcategoryId: 'norse-mythology',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-legendary-creatures-01',
    claim: 'Nearly every culture on Earth independently invented dragon legends',
    categoryId: 'mythology',
    subcategoryId: 'legendary-creatures',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-urban-legends-01',
    claim: 'The "Bloody Mary" mirror legend appears in cultures across six continents',
    categoryId: 'mythology',
    subcategoryId: 'urban-legends',
    curiosityStyle: 'mystery',
  },

  // ─── EXPLORATION (high-appeal) ────────────────────────────────────────

  {
    id: 'hook-polar-expeditions-01',
    claim: 'Shackleton\'s entire crew survived 2 years stranded in Antarctic ice',
    categoryId: 'exploration',
    subcategoryId: 'polar-expeditions',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-deep-sea-01',
    claim: 'More people have been to the Moon than to the deepest ocean trench',
    categoryId: 'exploration',
    subcategoryId: 'deep-sea',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-lost-cities-01',
    claim: 'The city of Dwarka was found submerged off India\'s coast after millennia',
    categoryId: 'exploration',
    subcategoryId: 'lost-cities',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-age-of-discovery-01',
    claim: 'Magellan\'s expedition lost 4 of 5 ships and 90% of its crew',
    categoryId: 'exploration',
    subcategoryId: 'age-of-discovery',
    curiosityStyle: 'number',
  },

  // ─── ARTS (medium) ────────────────────────────────────────────────────

  {
    id: 'hook-painting-01',
    claim: 'The Mona Lisa has her own mailbox because of all the love letters she receives',
    categoryId: 'arts',
    subcategoryId: 'painting',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-architecture-01',
    claim: 'The Great Wall of China is not actually visible from space with the naked eye',
    categoryId: 'arts',
    subcategoryId: 'architecture',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-film-01',
    claim: 'The Wilhelm Scream sound effect has appeared in over 400 films',
    categoryId: 'arts',
    subcategoryId: 'film',
    curiosityStyle: 'number',
  },

  // ─── MEDICINE (medium) ────────────────────────────────────────────────

  {
    id: 'hook-human-body-01',
    claim: 'Your stomach lining replaces itself every 3 to 4 days',
    categoryId: 'medicine',
    subcategoryId: 'human-body',
    curiosityStyle: 'number',
  },
  {
    id: 'hook-diseases-01',
    claim: 'Smallpox is the only human disease ever fully eradicated worldwide',
    categoryId: 'medicine',
    subcategoryId: 'diseases',
    curiosityStyle: 'scarcity',
  },

  // ─── ENGINEERING (medium) ─────────────────────────────────────────────

  {
    id: 'hook-megaprojects-01',
    claim: 'The International Space Station is the most expensive object ever built at $150 billion',
    categoryId: 'engineering',
    subcategoryId: 'megaprojects',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-civil-engineering-01',
    claim: 'The Panama Canal saves ships a 7,800-mile detour around South America',
    categoryId: 'engineering',
    subcategoryId: 'civil-engineering',
    curiosityStyle: 'number',
  },

  // ─── DISASTERS (medium) ───────────────────────────────────────────────

  {
    id: 'hook-nuclear-incidents-01',
    claim: 'Chernobyl\'s exclusion zone has become an accidental wildlife sanctuary',
    categoryId: 'disasters',
    subcategoryId: 'nuclear-incidents',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-maritime-disasters-01',
    claim: 'A ship sank in Lake Superior in 1975 and no one knows exactly why',
    categoryId: 'disasters',
    subcategoryId: 'maritime-disasters',
    curiosityStyle: 'mystery',
  },

  // ─── INVENTIONS (medium) ──────────────────────────────────────────────

  {
    id: 'hook-accidental-discoveries-01',
    claim: 'Penicillin was discovered because Alexander Fleming left a petri dish uncovered',
    categoryId: 'inventions',
    subcategoryId: 'accidental-discoveries',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-famous-inventions-01',
    claim: 'The microwave oven was invented after a chocolate bar melted in an engineer\'s pocket',
    categoryId: 'inventions',
    subcategoryId: 'famous-inventions',
    curiosityStyle: 'mystery',
  },

  // ─── PARANORMAL (medium) ──────────────────────────────────────────────

  {
    id: 'hook-unexplained-01',
    claim: 'The Wow! signal from space in 1977 has never been explained or repeated',
    categoryId: 'paranormal',
    subcategoryId: 'unexplained',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-conspiracy-theories-01',
    claim: 'Conspiracy theories activate the same brain regions as pattern recognition',
    categoryId: 'paranormal',
    subcategoryId: 'conspiracy-theories',
    curiosityStyle: 'mystery',
  },

  // ─── MUSIC (medium) ───────────────────────────────────────────────────

  {
    id: 'hook-classical-01',
    claim: 'Beethoven composed some of his greatest works while completely deaf',
    categoryId: 'music',
    subcategoryId: 'classical',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-music-theory-01',
    claim: 'Nearly all pop hits use the same four-chord progression',
    categoryId: 'music',
    subcategoryId: 'music-theory',
    curiosityStyle: 'scarcity',
  },

  // ─── POP-CULTURE (medium) ────────────────────────────────────────────

  {
    id: 'hook-video-games-01',
    claim: 'Tetris was created by a Soviet engineer and smuggled to the West',
    categoryId: 'pop-culture',
    subcategoryId: 'video-games',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-anime-01',
    claim: 'Studio Ghibli\'s hand-drawn films use up to 170,000 individual frames',
    categoryId: 'pop-culture',
    subcategoryId: 'anime',
    curiosityStyle: 'number',
  },

  // ─── NICHE CATEGORIES (1 each) ───────────────────────────────────────

  {
    id: 'hook-number-theory-01',
    claim: 'There is a $1 million prize for proving the Riemann hypothesis',
    categoryId: 'mathematics',
    subcategoryId: 'number-theory',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-existentialism-01',
    claim: 'Camus argued the most important philosophical question is whether to live',
    categoryId: 'philosophy',
    subcategoryId: 'existentialism',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-economic-history-01',
    claim: 'A single tulip bulb once cost more than a house in 1637 Amsterdam',
    categoryId: 'economics',
    subcategoryId: 'economic-history',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-olympic-sports-01',
    claim: 'The ancient Olympics were held for over 1,000 consecutive years',
    categoryId: 'sports',
    subcategoryId: 'olympic-sports',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-battles-01',
    claim: 'The Battle of Thermopylae pitted 300 Spartans against over 100,000 Persians',
    categoryId: 'military',
    subcategoryId: 'battles',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-food-history-01',
    claim: 'Ketchup was sold as medicine in the 1830s',
    categoryId: 'food',
    subcategoryId: 'food-history',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-sacred-texts-01',
    claim: 'The Dead Sea Scrolls survived over 2,000 years hidden in desert caves',
    categoryId: 'religion',
    subcategoryId: 'sacred-texts',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-dead-languages-01',
    claim: 'Linear A is an ancient script that remains completely undeciphered',
    categoryId: 'languages',
    subcategoryId: 'dead-languages',
    curiosityStyle: 'mystery',
  },
  {
    id: 'hook-succession-crises-01',
    claim: 'England had 5 different monarchs in a single year during the Wars of the Roses era',
    categoryId: 'royalty',
    subcategoryId: 'succession-crises',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-chess-01',
    claim: 'There are more possible chess games than atoms in the observable universe',
    categoryId: 'games',
    subcategoryId: 'chess',
    curiosityStyle: 'superlative',
  },
  {
    id: 'hook-propaganda-01',
    claim: 'Radio propaganda once convinced millions that aliens had invaded New Jersey',
    categoryId: 'media',
    subcategoryId: 'propaganda',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-startups-01',
    claim: 'Apple, Amazon, and Google all started in suburban garages',
    categoryId: 'business',
    subcategoryId: 'startups',
    curiosityStyle: 'contrast',
  },
  {
    id: 'hook-physical-geography-01',
    claim: 'There is a lake in Palau where millions of jellyfish sting-free swim with tourists',
    categoryId: 'geography',
    subcategoryId: 'physical-geography',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-climate-change-01',
    claim: 'Arctic ice holds trapped methane that could accelerate warming if released',
    categoryId: 'environment',
    subcategoryId: 'climate-change',
    curiosityStyle: 'conflict',
  },
  {
    id: 'hook-egyptology-01',
    claim: 'Tutankhamun\'s tomb lay undisturbed for over 3,200 years before discovery',
    categoryId: 'archaeology',
    subcategoryId: 'egyptology',
    curiosityStyle: 'scarcity',
  },
  {
    id: 'hook-aviation-01',
    claim: 'The SR-71 Blackbird still holds the speed record for a crewed air-breathing aircraft',
    categoryId: 'transportation',
    subcategoryId: 'aviation',
    curiosityStyle: 'superlative',
  },
];

/**
 * Look up a single curiosity hook by its ID.
 */
export function getHookById(id: string): CuriosityHook | undefined {
  return CURIOSITY_HOOKS.find((hook) => hook.id === id);
}

/**
 * Return a new array of all hooks in random order using the Fisher-Yates shuffle.
 */
export function getShuffledHooks(): CuriosityHook[] {
  const shuffled = [...CURIOSITY_HOOKS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
