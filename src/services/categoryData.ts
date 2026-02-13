import type { Category } from '../types';

/**
 * Static taxonomy of broad categories, each with subcategories
 * mapped to Wikipedia category names for article fetching.
 */
export const categories: Category[] = [
  {
    id: 'science',
    name: 'Science',
    iconName: 'activity',
    wikiCategories: ['Science', 'Scientific_method'],
    subcategories: [
      { id: 'physics', name: 'Physics', wikiCategories: ['Physics', 'Quantum_mechanics', 'Classical_mechanics'] },
      { id: 'chemistry', name: 'Chemistry', wikiCategories: ['Chemistry', 'Chemical_elements', 'Organic_chemistry'] },
      { id: 'biology', name: 'Biology', wikiCategories: ['Biology', 'Evolutionary_biology', 'Genetics'] },
      { id: 'earth-science', name: 'Earth Science', wikiCategories: ['Earth_sciences', 'Geology', 'Meteorology'] },
      { id: 'ecology', name: 'Ecology', wikiCategories: ['Ecology', 'Environmental_science'] },
      { id: 'neuroscience', name: 'Neuroscience', wikiCategories: ['Neuroscience', 'Cognitive_science'] },
      { id: 'paleontology', name: 'Paleontology', wikiCategories: ['Paleontology', 'Fossils', 'Dinosaurs'] },
    ],
  },
  {
    id: 'history',
    name: 'History',
    iconName: 'clock',
    wikiCategories: ['History', 'World_history'],
    subcategories: [
      { id: 'ancient-history', name: 'Ancient History', wikiCategories: ['Ancient_history', 'Ancient_civilizations'] },
      { id: 'medieval-history', name: 'Medieval History', wikiCategories: ['Medieval_history', 'Middle_Ages'] },
      { id: 'modern-history', name: 'Modern History', wikiCategories: ['Modern_history', 'Industrial_Revolution'] },
      { id: 'military-history', name: 'Military History', wikiCategories: ['Military_history', 'Wars'] },
      { id: 'american-history', name: 'American History', wikiCategories: ['History_of_the_United_States'] },
      { id: 'asian-history', name: 'Asian History', wikiCategories: ['History_of_Asia', 'Chinese_history'] },
      { id: 'european-history', name: 'European History', wikiCategories: ['History_of_Europe'] },
      { id: 'african-history', name: 'African History', wikiCategories: ['History_of_Africa'] },
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    iconName: 'cpu',
    wikiCategories: ['Technology', 'Computing'],
    subcategories: [
      { id: 'computer-science', name: 'Computer Science', wikiCategories: ['Computer_science', 'Algorithms'] },
      { id: 'artificial-intelligence', name: 'AI & Machine Learning', wikiCategories: ['Artificial_intelligence', 'Machine_learning'] },
      { id: 'internet', name: 'Internet & Web', wikiCategories: ['Internet', 'World_Wide_Web'] },
      { id: 'robotics', name: 'Robotics', wikiCategories: ['Robotics', 'Automation'] },
      { id: 'cybersecurity', name: 'Cybersecurity', wikiCategories: ['Computer_security', 'Cryptography'] },
      { id: 'electronics', name: 'Electronics', wikiCategories: ['Electronics', 'Semiconductors'] },
      { id: 'software', name: 'Software Engineering', wikiCategories: ['Software_engineering', 'Programming_languages'] },
    ],
  },
  {
    id: 'philosophy',
    name: 'Philosophy',
    iconName: 'compass',
    wikiCategories: ['Philosophy', 'Philosophical_concepts'],
    subcategories: [
      { id: 'ethics', name: 'Ethics', wikiCategories: ['Ethics', 'Moral_philosophy'] },
      { id: 'metaphysics', name: 'Metaphysics', wikiCategories: ['Metaphysics', 'Ontology'] },
      { id: 'epistemology', name: 'Epistemology', wikiCategories: ['Epistemology', 'Philosophy_of_mind'] },
      { id: 'logic', name: 'Logic', wikiCategories: ['Logic', 'Logical_fallacies'] },
      { id: 'political-philosophy', name: 'Political Philosophy', wikiCategories: ['Political_philosophy'] },
      { id: 'existentialism', name: 'Existentialism', wikiCategories: ['Existentialism', 'Phenomenology'] },
      { id: 'ancient-philosophy', name: 'Ancient Philosophy', wikiCategories: ['Ancient_Greek_philosophy', 'Eastern_philosophy'] },
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    iconName: 'globe',
    wikiCategories: ['Geography', 'Countries'],
    subcategories: [
      { id: 'physical-geography', name: 'Physical Geography', wikiCategories: ['Physical_geography', 'Landforms'] },
      { id: 'countries', name: 'Countries & Nations', wikiCategories: ['Countries', 'Sovereign_states'] },
      { id: 'cities', name: 'Cities', wikiCategories: ['Cities', 'Capital_cities'] },
      { id: 'oceans', name: 'Oceans & Seas', wikiCategories: ['Oceans', 'Seas'] },
      { id: 'mountains', name: 'Mountains', wikiCategories: ['Mountains', 'Mountain_ranges'] },
      { id: 'climate', name: 'Climate & Weather', wikiCategories: ['Climate', 'Weather'] },
    ],
  },
  {
    id: 'arts',
    name: 'Arts',
    iconName: 'feather',
    wikiCategories: ['The_arts', 'Visual_arts'],
    subcategories: [
      { id: 'painting', name: 'Painting', wikiCategories: ['Painting', 'Painters'] },
      { id: 'sculpture', name: 'Sculpture', wikiCategories: ['Sculpture', 'Sculptors'] },
      { id: 'photography', name: 'Photography', wikiCategories: ['Photography'] },
      { id: 'architecture', name: 'Architecture', wikiCategories: ['Architecture', 'Architectural_styles'] },
      { id: 'film', name: 'Film & Cinema', wikiCategories: ['Film', 'Filmmaking', 'Film_directors'] },
      { id: 'theater', name: 'Theater', wikiCategories: ['Theatre', 'Performing_arts'] },
      { id: 'literature', name: 'Literature', wikiCategories: ['Literature', 'Novels', 'Poetry'] },
      { id: 'design', name: 'Design', wikiCategories: ['Design', 'Graphic_design'] },
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    iconName: 'droplet',
    wikiCategories: ['Nature', 'Natural_history'],
    subcategories: [
      { id: 'animals', name: 'Animals', wikiCategories: ['Animals', 'Mammals', 'Birds'] },
      { id: 'plants', name: 'Plants', wikiCategories: ['Plants', 'Botany', 'Trees'] },
      { id: 'marine-life', name: 'Marine Life', wikiCategories: ['Marine_biology', 'Fish', 'Marine_mammals'] },
      { id: 'insects', name: 'Insects', wikiCategories: ['Insects', 'Entomology'] },
      { id: 'ecosystems', name: 'Ecosystems', wikiCategories: ['Ecosystems', 'Biomes'] },
      { id: 'conservation', name: 'Conservation', wikiCategories: ['Conservation', 'Endangered_species'] },
    ],
  },
  {
    id: 'medicine',
    name: 'Medicine',
    iconName: 'heart',
    wikiCategories: ['Medicine', 'Health'],
    subcategories: [
      { id: 'human-body', name: 'Human Body', wikiCategories: ['Human_body', 'Human_anatomy'] },
      { id: 'diseases', name: 'Diseases', wikiCategories: ['Diseases_and_disorders', 'Infectious_diseases'] },
      { id: 'pharmacology', name: 'Pharmacology', wikiCategories: ['Pharmacology', 'Drugs'] },
      { id: 'surgery', name: 'Surgery', wikiCategories: ['Surgery', 'Surgical_procedures'] },
      { id: 'mental-health', name: 'Mental Health', wikiCategories: ['Mental_health', 'Mental_disorders'] },
      { id: 'nutrition', name: 'Nutrition', wikiCategories: ['Nutrition', 'Vitamins'] },
      { id: 'epidemiology', name: 'Epidemiology', wikiCategories: ['Epidemiology', 'Pandemics'] },
    ],
  },
  {
    id: 'sports',
    name: 'Sports',
    iconName: 'award',
    wikiCategories: ['Sports', 'Athletic_sports'],
    subcategories: [
      { id: 'football', name: 'Football (Soccer)', wikiCategories: ['Association_football', 'FIFA_World_Cup'] },
      { id: 'basketball', name: 'Basketball', wikiCategories: ['Basketball', 'National_Basketball_Association'] },
      { id: 'baseball', name: 'Baseball', wikiCategories: ['Baseball', 'Major_League_Baseball'] },
      { id: 'olympic-sports', name: 'Olympics', wikiCategories: ['Olympic_Games', 'Olympic_sports'] },
      { id: 'tennis', name: 'Tennis', wikiCategories: ['Tennis', 'Grand_Slam_(tennis)'] },
      { id: 'motorsport', name: 'Motorsport', wikiCategories: ['Motorsport', 'Formula_One'] },
      { id: 'combat-sports', name: 'Combat Sports', wikiCategories: ['Combat_sports', 'Boxing', 'Martial_arts'] },
      { id: 'american-football', name: 'American Football', wikiCategories: ['American_football', 'National_Football_League'] },
    ],
  },
  {
    id: 'politics',
    name: 'Politics',
    iconName: 'flag',
    wikiCategories: ['Politics', 'Government'],
    subcategories: [
      { id: 'democracy', name: 'Democracy', wikiCategories: ['Democracy', 'Elections'] },
      { id: 'international-relations', name: 'International Relations', wikiCategories: ['International_relations', 'Diplomacy'] },
      { id: 'political-leaders', name: 'Political Leaders', wikiCategories: ['Heads_of_state', 'Politicians'] },
      { id: 'political-ideologies', name: 'Political Ideologies', wikiCategories: ['Political_ideologies'] },
      { id: 'law', name: 'Law & Justice', wikiCategories: ['Law', 'Jurisprudence'] },
      { id: 'human-rights', name: 'Human Rights', wikiCategories: ['Human_rights', 'Civil_rights'] },
    ],
  },
  {
    id: 'economics',
    name: 'Economics',
    iconName: 'trending-up',
    wikiCategories: ['Economics', 'Economy'],
    subcategories: [
      { id: 'macroeconomics', name: 'Macroeconomics', wikiCategories: ['Macroeconomics', 'Gross_domestic_product'] },
      { id: 'microeconomics', name: 'Microeconomics', wikiCategories: ['Microeconomics', 'Supply_and_demand'] },
      { id: 'finance', name: 'Finance', wikiCategories: ['Finance', 'Banking', 'Stock_market'] },
      { id: 'trade', name: 'Trade', wikiCategories: ['International_trade', 'Free_trade'] },
      { id: 'cryptocurrency', name: 'Cryptocurrency', wikiCategories: ['Cryptocurrencies', 'Blockchain'] },
      { id: 'economic-history', name: 'Economic History', wikiCategories: ['Economic_history'] },
    ],
  },
  {
    id: 'languages',
    name: 'Languages',
    iconName: 'type',
    wikiCategories: ['Languages', 'Linguistics'],
    subcategories: [
      { id: 'linguistics', name: 'Linguistics', wikiCategories: ['Linguistics', 'Phonology', 'Syntax'] },
      { id: 'writing-systems', name: 'Writing Systems', wikiCategories: ['Writing_systems', 'Alphabets'] },
      { id: 'dead-languages', name: 'Ancient & Dead Languages', wikiCategories: ['Dead_languages', 'Latin', 'Ancient_Greek'] },
      { id: 'language-families', name: 'Language Families', wikiCategories: ['Language_families'] },
      { id: 'sign-languages', name: 'Sign Languages', wikiCategories: ['Sign_languages'] },
      { id: 'constructed-languages', name: 'Constructed Languages', wikiCategories: ['Constructed_languages', 'Esperanto'] },
    ],
  },
  {
    id: 'religion',
    name: 'Religion',
    iconName: 'star',
    wikiCategories: ['Religion', 'Religious_studies'],
    subcategories: [
      { id: 'christianity', name: 'Christianity', wikiCategories: ['Christianity', 'Christian_theology'] },
      { id: 'islam', name: 'Islam', wikiCategories: ['Islam', 'Islamic_studies'] },
      { id: 'buddhism', name: 'Buddhism', wikiCategories: ['Buddhism', 'Buddhist_philosophy'] },
      { id: 'hinduism', name: 'Hinduism', wikiCategories: ['Hinduism', 'Hindu_philosophy'] },
      { id: 'sacred-texts', name: 'Sacred Texts', wikiCategories: ['Religious_texts', 'Sacred_texts'] },
      { id: 'comparative-religion', name: 'Comparative Religion', wikiCategories: ['Comparative_religion'] },
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    iconName: 'coffee',
    wikiCategories: ['Food_and_drink', 'Cuisine'],
    subcategories: [
      { id: 'cuisines', name: 'World Cuisines', wikiCategories: ['Cuisine', 'Italian_cuisine', 'Japanese_cuisine'] },
      { id: 'cooking', name: 'Cooking & Techniques', wikiCategories: ['Cooking', 'Cooking_techniques'] },
      { id: 'beverages', name: 'Beverages', wikiCategories: ['Beverages', 'Coffee', 'Tea'] },
      { id: 'wine-beer', name: 'Wine & Beer', wikiCategories: ['Wine', 'Beer', 'Brewing'] },
      { id: 'food-history', name: 'Food History', wikiCategories: ['History_of_food'] },
      { id: 'agriculture', name: 'Agriculture', wikiCategories: ['Agriculture', 'Farming'] },
    ],
  },
  {
    id: 'space',
    name: 'Space',
    iconName: 'target',
    wikiCategories: ['Outer_space', 'Astronomy'],
    subcategories: [
      { id: 'astronomy', name: 'Astronomy', wikiCategories: ['Astronomy', 'Observational_astronomy'] },
      { id: 'solar-system', name: 'Solar System', wikiCategories: ['Solar_System', 'Planets'] },
      { id: 'stars-galaxies', name: 'Stars & Galaxies', wikiCategories: ['Stars', 'Galaxies'] },
      { id: 'space-exploration', name: 'Space Exploration', wikiCategories: ['Space_exploration', 'NASA', 'SpaceX'] },
      { id: 'cosmology', name: 'Cosmology', wikiCategories: ['Cosmology', 'Big_Bang'] },
      { id: 'astrobiology', name: 'Astrobiology', wikiCategories: ['Astrobiology', 'Extraterrestrial_life'] },
    ],
  },
  {
    id: 'music',
    name: 'Music',
    iconName: 'music',
    wikiCategories: ['Music', 'Musical_genres'],
    subcategories: [
      { id: 'rock', name: 'Rock & Roll', wikiCategories: ['Rock_music', 'Rock_and_roll'] },
      { id: 'classical', name: 'Classical Music', wikiCategories: ['Classical_music', 'Composers'] },
      { id: 'hip-hop', name: 'Hip Hop', wikiCategories: ['Hip_hop_music', 'Rappers'] },
      { id: 'jazz', name: 'Jazz', wikiCategories: ['Jazz', 'Jazz_musicians'] },
      { id: 'electronic', name: 'Electronic Music', wikiCategories: ['Electronic_music', 'DJs'] },
      { id: 'pop', name: 'Pop Music', wikiCategories: ['Pop_music', 'Pop_singers'] },
      { id: 'music-theory', name: 'Music Theory', wikiCategories: ['Music_theory', 'Musical_notation'] },
      { id: 'instruments', name: 'Musical Instruments', wikiCategories: ['Musical_instruments'] },
    ],
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    iconName: 'hash',
    wikiCategories: ['Mathematics', 'Mathematical_concepts'],
    subcategories: [
      { id: 'algebra', name: 'Algebra', wikiCategories: ['Algebra', 'Linear_algebra'] },
      { id: 'geometry', name: 'Geometry', wikiCategories: ['Geometry', 'Euclidean_geometry'] },
      { id: 'calculus', name: 'Calculus', wikiCategories: ['Calculus', 'Mathematical_analysis'] },
      { id: 'number-theory', name: 'Number Theory', wikiCategories: ['Number_theory', 'Prime_numbers'] },
      { id: 'statistics', name: 'Statistics', wikiCategories: ['Statistics', 'Probability'] },
      { id: 'mathematicians', name: 'Mathematicians', wikiCategories: ['Mathematicians'] },
      { id: 'applied-math', name: 'Applied Mathematics', wikiCategories: ['Applied_mathematics'] },
    ],
  },
  {
    id: 'pop-culture',
    name: 'Pop Culture',
    iconName: 'film',
    wikiCategories: ['Popular_culture', 'Entertainment'],
    subcategories: [
      { id: 'tv-shows', name: 'TV Shows', wikiCategories: ['Television_series', 'Television'] },
      { id: 'video-games', name: 'Video Games', wikiCategories: ['Video_games', 'Video_game_consoles'] },
      { id: 'comics', name: 'Comics & Manga', wikiCategories: ['Comics', 'Manga', 'Superheroes'] },
      { id: 'anime', name: 'Anime', wikiCategories: ['Anime', 'Anime_series'] },
      { id: 'celebrities', name: 'Celebrities', wikiCategories: ['Celebrities', 'Actors'] },
      { id: 'memes', name: 'Internet Culture', wikiCategories: ['Internet_culture', 'Internet_memes'] },
      { id: 'fashion', name: 'Fashion', wikiCategories: ['Fashion', 'Fashion_designers'] },
    ],
  },
  {
    id: 'psychology',
    name: 'Psychology',
    iconName: 'eye',
    wikiCategories: ['Psychology', 'Behavioral_science'],
    subcategories: [
      { id: 'cognitive-psychology', name: 'Cognitive Psychology', wikiCategories: ['Cognitive_psychology', 'Cognitive_biases'] },
      { id: 'social-psychology', name: 'Social Psychology', wikiCategories: ['Social_psychology', 'Social_influence'] },
      { id: 'developmental-psychology', name: 'Developmental Psychology', wikiCategories: ['Developmental_psychology'] },
      { id: 'abnormal-psychology', name: 'Abnormal Psychology', wikiCategories: ['Abnormal_psychology', 'Personality_disorders'] },
      { id: 'personality', name: 'Personality', wikiCategories: ['Personality_psychology', 'Personality_traits'] },
      { id: 'behavioral-economics', name: 'Behavioral Economics', wikiCategories: ['Behavioral_economics', 'Decision-making'] },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    iconName: 'truck',
    wikiCategories: ['Transport', 'Vehicles'],
    subcategories: [
      { id: 'aviation', name: 'Aviation', wikiCategories: ['Aviation', 'Aircraft', 'Airlines'] },
      { id: 'automobiles', name: 'Automobiles', wikiCategories: ['Automobiles', 'Car_manufacturers'] },
      { id: 'railways', name: 'Railways', wikiCategories: ['Rail_transport', 'Trains', 'Locomotives'] },
      { id: 'ships', name: 'Ships & Maritime', wikiCategories: ['Ships', 'Maritime_transport', 'Shipwrecks'] },
      { id: 'space-vehicles', name: 'Spacecraft', wikiCategories: ['Spacecraft', 'Space_vehicles'] },
      { id: 'cycling', name: 'Cycling', wikiCategories: ['Cycling', 'Bicycles'] },
    ],
  },
  {
    id: 'true-crime',
    name: 'True Crime',
    iconName: 'alert-triangle',
    wikiCategories: ['Crime', 'Criminal_cases'],
    subcategories: [
      { id: 'unsolved-cases', name: 'Unsolved Cases', wikiCategories: ['Unsolved_murders', 'Unsolved_crimes'] },
      { id: 'serial-killers', name: 'Serial Killers', wikiCategories: ['Serial_killers', 'Mass_murderers'] },
      { id: 'heists', name: 'Heists & Robberies', wikiCategories: ['Robberies', 'Heists'] },
      { id: 'forensics', name: 'Forensic Science', wikiCategories: ['Forensic_science', 'Crime_detection'] },
      { id: 'wrongful-convictions', name: 'Wrongful Convictions', wikiCategories: ['Wrongful_convictions', 'Miscarriage_of_justice'] },
      { id: 'organized-crime', name: 'Organized Crime', wikiCategories: ['Organized_crime', 'Mafia'] },
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    iconName: 'tool',
    wikiCategories: ['Engineering', 'Construction'],
    subcategories: [
      { id: 'civil-engineering', name: 'Civil Engineering', wikiCategories: ['Civil_engineering', 'Bridges', 'Dams'] },
      { id: 'mechanical-engineering', name: 'Mechanical Engineering', wikiCategories: ['Mechanical_engineering', 'Machines'] },
      { id: 'electrical-engineering', name: 'Electrical Engineering', wikiCategories: ['Electrical_engineering'] },
      { id: 'buildings', name: 'Famous Buildings', wikiCategories: ['Buildings_and_structures', 'Skyscrapers'] },
      { id: 'megaprojects', name: 'Megaprojects', wikiCategories: ['Megaprojects', 'Tunnels', 'Canals'] },
      { id: 'materials-science', name: 'Materials Science', wikiCategories: ['Materials_science'] },
    ],
  },
  {
    id: 'military',
    name: 'Military',
    iconName: 'crosshair',
    wikiCategories: ['Military', 'Armed_forces'],
    subcategories: [
      { id: 'battles', name: 'Battles', wikiCategories: ['Battles', 'Sieges'] },
      { id: 'weapons', name: 'Weapons', wikiCategories: ['Weapons', 'Firearms', 'Swords'] },
      { id: 'military-vehicles', name: 'Military Vehicles', wikiCategories: ['Military_vehicles', 'Tanks', 'Warships'] },
      { id: 'special-forces', name: 'Special Forces', wikiCategories: ['Special_forces'] },
      { id: 'military-strategy', name: 'Military Strategy', wikiCategories: ['Military_strategy', 'Military_tactics'] },
      { id: 'intelligence', name: 'Intelligence & Espionage', wikiCategories: ['Espionage', 'Intelligence_agencies'] },
    ],
  },
  {
    id: 'environment',
    name: 'Environment',
    iconName: 'cloud',
    wikiCategories: ['Natural_environment', 'Environmental_science'],
    subcategories: [
      { id: 'climate-change', name: 'Climate Change', wikiCategories: ['Climate_change', 'Global_warming'] },
      { id: 'renewable-energy', name: 'Renewable Energy', wikiCategories: ['Renewable_energy', 'Solar_energy', 'Wind_power'] },
      { id: 'pollution', name: 'Pollution', wikiCategories: ['Pollution', 'Air_pollution', 'Water_pollution'] },
      { id: 'sustainability', name: 'Sustainability', wikiCategories: ['Sustainability', 'Sustainable_development'] },
      { id: 'natural-disasters', name: 'Natural Disasters', wikiCategories: ['Natural_disasters', 'Earthquakes', 'Volcanic_eruptions'] },
      { id: 'ocean-science', name: 'Ocean Science', wikiCategories: ['Oceanography', 'Marine_pollution'] },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    iconName: 'briefcase',
    wikiCategories: ['Business', 'Entrepreneurship'],
    subcategories: [
      { id: 'startups', name: 'Startups', wikiCategories: ['Startup_companies', 'Venture_capital'] },
      { id: 'companies', name: 'Famous Companies', wikiCategories: ['Companies', 'Multinational_corporations'] },
      { id: 'marketing', name: 'Marketing', wikiCategories: ['Marketing', 'Advertising'] },
      { id: 'management', name: 'Management', wikiCategories: ['Management', 'Leadership'] },
      { id: 'industries', name: 'Industries', wikiCategories: ['Industries', 'Manufacturing'] },
      { id: 'business-people', name: 'Business People', wikiCategories: ['Businesspeople', 'Billionaires'] },
    ],
  },
  {
    id: 'archaeology',
    name: 'Archaeology',
    iconName: 'map',
    wikiCategories: ['Archaeology', 'Archaeological_sites'],
    subcategories: [
      { id: 'ancient-ruins', name: 'Ancient Ruins', wikiCategories: ['Ancient_ruins', 'Archaeological_sites'] },
      { id: 'artifacts', name: 'Artifacts', wikiCategories: ['Artifacts', 'Ancient_artifacts'] },
      { id: 'egyptology', name: 'Egyptology', wikiCategories: ['Egyptology', 'Ancient_Egypt'] },
      { id: 'prehistoric', name: 'Prehistoric', wikiCategories: ['Prehistoric_cultures', 'Stone_Age'] },
      { id: 'underwater-archaeology', name: 'Underwater Archaeology', wikiCategories: ['Underwater_archaeology', 'Shipwrecks'] },
      { id: 'anthropology', name: 'Anthropology', wikiCategories: ['Anthropology', 'Sociology'] },
    ],
  },
  {
    id: 'paranormal',
    name: 'Paranormal & Unexplained',
    iconName: 'help-circle',
    wikiCategories: ['Paranormal', 'Unexplained_phenomena'],
    subcategories: [
      { id: 'ufos', name: 'UFOs & UAPs', wikiCategories: ['Unidentified_flying_objects', 'UFO_sightings'] },
      { id: 'cryptozoology', name: 'Cryptozoology', wikiCategories: ['Cryptozoology', 'Cryptids'] },
      { id: 'ghosts', name: 'Ghosts & Hauntings', wikiCategories: ['Ghosts', 'Haunted_locations'] },
      { id: 'conspiracy-theories', name: 'Conspiracy Theories', wikiCategories: ['Conspiracy_theories'] },
      { id: 'unexplained', name: 'Unexplained Phenomena', wikiCategories: ['Anomalous_phenomena', 'Bermuda_Triangle'] },
      { id: 'pseudoscience', name: 'Pseudoscience', wikiCategories: ['Pseudoscience', 'Fringe_science'] },
    ],
  },
  {
    id: 'disasters',
    name: 'Disasters',
    iconName: 'alert-octagon',
    wikiCategories: ['Disasters', 'Accidents'],
    subcategories: [
      { id: 'aviation-accidents', name: 'Aviation Accidents', wikiCategories: ['Aviation_accidents_and_incidents'] },
      { id: 'maritime-disasters', name: 'Maritime Disasters', wikiCategories: ['Maritime_disasters', 'Shipwrecks'] },
      { id: 'nuclear-incidents', name: 'Nuclear Incidents', wikiCategories: ['Nuclear_accidents', 'Nuclear_and_radiation_accidents'] },
      { id: 'industrial-disasters', name: 'Industrial Disasters', wikiCategories: ['Industrial_disasters', 'Explosions'] },
      { id: 'historic-earthquakes', name: 'Historic Earthquakes', wikiCategories: ['Earthquakes', 'Lists_of_earthquakes'] },
      { id: 'historic-epidemics', name: 'Epidemics & Plagues', wikiCategories: ['Epidemics', 'Plague_(disease)'] },
    ],
  },
  {
    id: 'exploration',
    name: 'Exploration',
    iconName: 'navigation',
    wikiCategories: ['Exploration', 'Expeditions'],
    subcategories: [
      { id: 'age-of-discovery', name: 'Age of Discovery', wikiCategories: ['Age_of_Discovery', 'Voyages_of_discovery'] },
      { id: 'polar-expeditions', name: 'Polar Expeditions', wikiCategories: ['Arctic_expeditions', 'Antarctic_expeditions'] },
      { id: 'mountaineering', name: 'Mountaineering', wikiCategories: ['Mountaineering', 'Mount_Everest'] },
      { id: 'deep-sea', name: 'Deep Sea Exploration', wikiCategories: ['Deep-sea_exploration', 'Underwater_diving'] },
      { id: 'famous-explorers', name: 'Famous Explorers', wikiCategories: ['Explorers', 'Navigators'] },
      { id: 'lost-cities', name: 'Lost Cities', wikiCategories: ['Lost_cities', 'Ruins'] },
    ],
  },
  {
    id: 'mythology',
    name: 'Mythology & Folklore',
    iconName: 'book',
    wikiCategories: ['Mythology', 'Folklore'],
    subcategories: [
      { id: 'greek-mythology', name: 'Greek Mythology', wikiCategories: ['Greek_mythology', 'Greek_gods'] },
      { id: 'norse-mythology', name: 'Norse Mythology', wikiCategories: ['Norse_mythology', 'Norse_gods'] },
      { id: 'world-mythology', name: 'World Mythology', wikiCategories: ['Mythologies_by_culture', 'Egyptian_mythology', 'Japanese_mythology'] },
      { id: 'legendary-creatures', name: 'Legendary Creatures', wikiCategories: ['Legendary_creatures', 'Dragons', 'Mythological_creatures'] },
      { id: 'fairy-tales', name: 'Fairy Tales & Folklore', wikiCategories: ['Fairy_tales', 'Folklore'] },
      { id: 'urban-legends', name: 'Urban Legends', wikiCategories: ['Urban_legends', 'Contemporary_legends'] },
    ],
  },
  {
    id: 'royalty',
    name: 'Royalty & Dynasties',
    iconName: 'shield',
    wikiCategories: ['Royalty', 'Monarchy'],
    subcategories: [
      { id: 'monarchies', name: 'Monarchies', wikiCategories: ['Monarchies', 'Monarchy'] },
      { id: 'royal-families', name: 'Royal Families', wikiCategories: ['Royal_families', 'British_royal_family'] },
      { id: 'dynasties', name: 'Dynasties', wikiCategories: ['Dynasties', 'Chinese_dynasties', 'Egyptian_dynasties'] },
      { id: 'succession-crises', name: 'Succession Crises', wikiCategories: ['Succession_crises', 'Wars_of_succession'] },
      { id: 'famous-monarchs', name: 'Famous Monarchs', wikiCategories: ['Monarchs', 'Kings', 'Queens_regnant'] },
      { id: 'court-life', name: 'Court Life', wikiCategories: ['Royal_courts', 'Nobility'] },
    ],
  },
  {
    id: 'inventions',
    name: 'Inventions',
    iconName: 'zap',
    wikiCategories: ['Inventions', 'Technological_change'],
    subcategories: [
      { id: 'famous-inventions', name: 'Famous Inventions', wikiCategories: ['Inventions', 'Technological_firsts'] },
      { id: 'accidental-discoveries', name: 'Accidental Discoveries', wikiCategories: ['Accidental_discoveries', 'Serendipity'] },
      { id: 'industrial-inventions', name: 'Industrial Revolution', wikiCategories: ['Industrial_Revolution', 'Steam_engines'] },
      { id: 'modern-innovations', name: 'Modern Innovations', wikiCategories: ['Emerging_technologies', '21st-century_inventions'] },
      { id: 'inventors', name: 'Inventors', wikiCategories: ['Inventors', 'Patent_holders'] },
      { id: 'history-of-tech', name: 'History of Technology', wikiCategories: ['History_of_technology'] },
    ],
  },
  {
    id: 'media',
    name: 'Media & Journalism',
    iconName: 'radio',
    wikiCategories: ['Mass_media', 'Journalism'],
    subcategories: [
      { id: 'broadcasting', name: 'Broadcasting', wikiCategories: ['Broadcasting', 'Television_networks', 'Radio_stations'] },
      { id: 'newspapers', name: 'Newspapers & Print', wikiCategories: ['Newspapers', 'Magazines'] },
      { id: 'propaganda', name: 'Propaganda', wikiCategories: ['Propaganda', 'Disinformation'] },
      { id: 'social-media', name: 'Social Media', wikiCategories: ['Social_media', 'Social_networking_services'] },
      { id: 'telecommunications', name: 'Telecommunications', wikiCategories: ['Telecommunications', 'Telephone'] },
      { id: 'famous-journalists', name: 'Famous Journalists', wikiCategories: ['Journalists', 'War_correspondents'] },
    ],
  },
  {
    id: 'games',
    name: 'Games & Puzzles',
    iconName: 'play',
    wikiCategories: ['Games', 'Puzzles'],
    subcategories: [
      { id: 'board-games', name: 'Board Games', wikiCategories: ['Board_games', 'Strategy_games'] },
      { id: 'chess', name: 'Chess', wikiCategories: ['Chess', 'Chess_openings', 'Chess_players'] },
      { id: 'card-games', name: 'Card Games', wikiCategories: ['Card_games', 'Poker', 'Playing_cards'] },
      { id: 'puzzles', name: 'Puzzles & Riddles', wikiCategories: ['Puzzles', 'Logic_puzzles', 'Mathematical_puzzles'] },
      { id: 'tabletop-rpgs', name: 'Tabletop RPGs', wikiCategories: ['Tabletop_role-playing_games', 'Dungeons_%26_Dragons'] },
      { id: 'game-theory', name: 'Game Theory', wikiCategories: ['Game_theory', 'Recreational_mathematics'] },
    ],
  },
];

/**
 * Get a category by its ID
 */
export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

/**
 * Get all subcategory IDs for a category
 */
export function getSubcategoryIds(categoryId: string): string[] {
  const cat = getCategoryById(categoryId);
  return cat ? cat.subcategories.map(s => s.id) : [];
}

/**
 * Get Wikipedia categories for a given category or subcategory ID
 * Used by feed algorithm to fetch articles from Wikipedia
 */
export function getWikiCategoriesForId(id: string): string[] {
  // Check broad categories first
  const cat = getCategoryById(id);
  if (cat) return cat.wikiCategories;

  // Check subcategories
  for (const category of categories) {
    const sub = category.subcategories.find(s => s.id === id);
    if (sub) return sub.wikiCategories;
  }

  return [];
}

/**
 * Get the parent category for a subcategory ID
 */
export function getParentCategory(subcategoryId: string): Category | undefined {
  return categories.find(c => c.subcategories.some(s => s.id === subcategoryId));
}

/**
 * Get all Wikipedia category names that a user is interested in,
 * based on their selected category and subcategory IDs
 */
export function getSelectedWikiCategories(
  selectedCategoryIds: string[],
  selectedSubcategoryIds: string[]
): string[] {
  const wikiCats = new Set<string>();

  for (const catId of selectedCategoryIds) {
    const cat = getCategoryById(catId);
    if (!cat) continue;

    // Add broad category wiki categories
    cat.wikiCategories.forEach(wc => wikiCats.add(wc));

    // If user selected specific subcategories for this category, add those
    const selectedSubs = cat.subcategories.filter(s =>
      selectedSubcategoryIds.includes(s.id)
    );

    if (selectedSubs.length > 0) {
      selectedSubs.forEach(s => s.wikiCategories.forEach(wc => wikiCats.add(wc)));
    } else {
      // If no subcategories selected, add all subcategory wiki categories
      cat.subcategories.forEach(s => s.wikiCategories.forEach(wc => wikiCats.add(wc)));
    }
  }

  return Array.from(wikiCats);
}
