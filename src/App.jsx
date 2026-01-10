import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, runTransaction, increment, set, get } from 'firebase/database';
import html2canvas from 'html2canvas';
import { useVersionCheck } from './useVersionCheck';
import UpdateNotification from './UpdateNotification';

// App Version
const APP_VERSION = '5.3.0';
const BUILD_DATE = '2026-01-11';

// Gamification: Point Values
const POINTS = {
  // Check-in points
  BASE_CHECKIN: 10,
  PER_SOURCE: 5,
  EVERYTHING_BONUS: 30,
  NOTHING_CBT_COMPLETE: 40,

  // Engagement points (Boost feedback system!)
  QUOTE_BOOST: 10,
  EXERCISE_BOOST: 15,
  BREATHWORK_BOOST: 15,
  CBT_BOOST: 20,

  // Sharing points (spreading joy!)
  SHARE_QUOTE: 20,
  SHARE_EXERCISE: 20,
  SHARE_SMILE: 30,
  SHARE_ACHIEVEMENT: 25,
  SHARE_PATTERNS: 25,

  // Daily bonuses
  FIRST_CHECKIN: 25,
  MORNING_RITUAL: 15,
  EVENING_RITUAL: 15,
  NIGHT_RITUAL: 15,
  ALL_RITUALS: 50,
};

// Gamification: Levels & Ranks
const RANKS = [
  { level: 0, name: 'Happiness Seedling', emoji: '🌱', minPoints: 0 },
  { level: 1, name: 'Joy Seeker', emoji: '🌿', minPoints: 100 },
  { level: 2, name: 'Smile Spreader', emoji: '🌻', minPoints: 500 },
  { level: 3, name: 'Radiant Soul', emoji: '✨', minPoints: 1500 },
  { level: 4, name: 'Beacon of Joy', emoji: '🌟', minPoints: 3000 },
  { level: 5, name: 'Enlightened', emoji: '💫', minPoints: 5000 },
];

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMKvmSrwTsJAIz0U0D9n9eBQ0Meav3I1g",
  authDomain: "stillhappy-92482.firebaseapp.com",
  databaseURL: "https://stillhappy-92482-default-rtdb.firebaseio.com",
  projectId: "stillhappy-92482",
  storageBucket: "stillhappy-92482.firebasestorage.app",
  messagingSenderId: "611348244768",
  appId: "1:611348244768:web:02df514e089311dd7acf45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Global counter functions
const globalCounterRef = ref(database, 'globalStats');

const incrementActiveStreaks = () => {
  const activeRef = ref(database, 'globalStats/activeStreaks');
  runTransaction(activeRef, (current) => (current || 0) + 1);
};

const decrementActiveStreaks = () => {
  const activeRef = ref(database, 'globalStats/activeStreaks');
  runTransaction(activeRef, (current) => Math.max((current || 0) - 1, 0));
};

const incrementCheckins = () => {
  const totalRef = ref(database, 'globalStats/totalCheckins');
  // Use local date instead of UTC
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayRef = ref(database, `globalStats/todayCheckins/${localDate}`);
  runTransaction(totalRef, (current) => (current || 0) + 1);
  runTransaction(todayRef, (current) => (current || 0) + 1);
};

// Gamification: Increment global joy points (world counter)
const incrementGlobalJoyPoints = (points) => {
  const now = new Date();
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const localHour = `${localDate}-${String(now.getHours()).padStart(2, '0')}`;

  const totalRef = ref(database, 'globalStats/totalJoyPoints');
  const todayRef = ref(database, `globalStats/todayJoyPoints/${localDate}`);
  const hourRef = ref(database, `globalStats/hourlyJoyPoints/${localHour}`);

  runTransaction(totalRef, (current) => (current || 0) + points);
  runTransaction(todayRef, (current) => (current || 0) + points);
  runTransaction(hourRef, (current) => (current || 0) + points);
};

// Increment global happiness source counter
const incrementHappinessSource = (source) => {
  if (!source) return;
  const sourceRef = ref(database, `globalHappinessSources/${source}`);
  runTransaction(sourceRef, (current) => (current || 0) + 1);
};

// Track global favorites for quotes and exercises
const incrementQuoteFavorite = (quoteIndex) => {
  const favoriteRef = ref(database, `globalFavorites/quotes/${quoteIndex}`);
  runTransaction(favoriteRef, (current) => (current || 0) + 1);
};

const decrementQuoteFavorite = (quoteIndex) => {
  const favoriteRef = ref(database, `globalFavorites/quotes/${quoteIndex}`);
  runTransaction(favoriteRef, (current) => Math.max((current || 0) - 1, 0));
};

const incrementExerciseFavorite = (exerciseIndex) => {
  const favoriteRef = ref(database, `globalFavorites/exercises/${exerciseIndex}`);
  runTransaction(favoriteRef, (current) => (current || 0) + 1);
};

const decrementExerciseFavorite = (exerciseIndex) => {
  const favoriteRef = ref(database, `globalFavorites/exercises/${exerciseIndex}`);
  runTransaction(favoriteRef, (current) => Math.max((current || 0) - 1, 0));
};

const incrementCBTFavorite = (cbtIndex) => {
  const favoriteRef = ref(database, `globalFavorites/cbtExercises/${cbtIndex}`);
  runTransaction(favoriteRef, (current) => (current || 0) + 1);
};

const decrementCBTFavorite = (cbtIndex) => {
  const favoriteRef = ref(database, `globalFavorites/cbtExercises/${cbtIndex}`);
  runTransaction(favoriteRef, (current) => Math.max((current || 0) - 1, 0));
};

// Reference for global happiness sources
const globalHappinessSourcesRef = ref(database, 'globalHappinessSources');
// References for global favorites
const globalFavoriteQuotesRef = ref(database, 'globalFavorites/quotes');
const globalFavoriteExercisesRef = ref(database, 'globalFavorites/exercises');
const globalFavoriteCBTRef = ref(database, 'globalFavorites/cbtExercises');

// Micro-moments - gentle mindfulness prompts
const microMoments = [
  { icon: "🌬️", text: "Take a deep breath right now" },
  { icon: "🌸", text: "Notice something beautiful around you" },
  { icon: "💛", text: "Who could you thank today?" },
  { icon: "😊", text: "Smile - even if you don't feel like it" },
  { icon: "👂", text: "What can you hear? Really listen" },
  { icon: "🌿", text: "Right now, you're alive and breathing" },
  { icon: "✨", text: "What small joy is right in front of you?" },
  { icon: "🎨", text: "Notice a color that brings you peace" },
  { icon: "💫", text: "Place your hand on your heart. Breathe" },
  { icon: "🙏", text: "What are you grateful for right now?" },
  { icon: "🌅", text: "This moment will never come again" },
  { icon: "💚", text: "You're doing better than you think" },
  { icon: "🌊", text: "Let go of what you can't control" },
  { icon: "🦋", text: "Change begins with this breath" },
  { icon: "🌟", text: "You are exactly where you need to be" }
];

// Random encouragement messages - personalized joy sprinkles
const encouragementMessages = {
  appOpen: [
    { text: "Welcome back, joy warrior!", emoji: "💫" },
    { text: "Your happiness journey continues!", emoji: "✨" },
    { text: "Ready to spread some smiles?", emoji: "😊" },
    { text: "So glad you're here!", emoji: "💛" },
    { text: "Let's make today beautiful!", emoji: "🌟" },
  ],
  afterCheckIn: [
    { text: "That's {count} smile{s} today!", emoji: "🌟" },
    { text: "Your {streak}-day streak is glowing!", emoji: "🔥" },
    { text: "You're building something beautiful!", emoji: "✨" },
    { text: "Another moment of joy captured!", emoji: "💫" },
  ],
  afterPowerBoost: [
    { text: "That's {count} tool{s} this week!", emoji: "🔥" },
    { text: "You're on fire!", emoji: "✨" },
    { text: "Keep that momentum going!", emoji: "💪" },
    { text: "Your happiness toolkit grows!", emoji: "🌟" },
  ],
  roundNumber: [
    { text: "Nice! {points} points!", emoji: "✨" },
    { text: "Wow! {points} points of pure joy!", emoji: "🎉" },
    { text: "{points} points - you're amazing!", emoji: "💫" },
  ],
  milestone: [
    { text: "That's your best streak ever!", emoji: "🏆" },
    { text: "You're a happiness legend!", emoji: "👑" },
    { text: "Incredible dedication!", emoji: "💎" },
  ],
};

// Wisdom quotes from various traditions
const wisdomQuotes = [
  { text: "Pain is inevitable, but suffering is optional. The present moment is filled with joy and happiness.", author: "Thich Nhat Hanh", tradition: "Buddhist Monk" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama XIV", tradition: "Tibetan Buddhism" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius", tradition: "Stoic Philosophy" },
  { text: "The wound is the place where the Light enters you.", author: "Rumi", tradition: "Sufi Mysticism" },
  { text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi", tradition: "13th Century Poet" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", tradition: "Taoist Philosophy" },
  { text: "Be content with what you have; rejoice in the way things are.", author: "Lao Tzu", tradition: "Tao Te Ching" },
  { text: "Happiness depends upon ourselves.", author: "Aristotle", tradition: "Greek Philosophy" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", tradition: "Roman Emperor" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose.", author: "Viktor Frankl", tradition: "Holocaust Survivor" },
  { text: "For small creatures such as we the vastness is bearable only through love.", author: "Carl Sagan", tradition: "Astronomer" },
  { text: "However long the night, the dawn will break.", author: "African Proverb", tradition: "Traditional Wisdom" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", tradition: "Zen Wisdom" },
  { text: "What you seek is seeking you.", author: "Rumi", tradition: "Persian Poetry" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca", tradition: "Stoic Philosophy" },
  { text: "The bamboo that bends is stronger than the oak that resists.", author: "Japanese Proverb", tradition: "Traditional Teaching" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb", tradition: "Ubuntu Philosophy" },
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha", tradition: "Buddhist Teaching" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh", tradition: "Mindfulness Teacher" },
  { text: "When you arise in the morning, give thanks for the light, for your life, for your strength.", author: "Tecumseh", tradition: "Shawnee Leader" },
  { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi", tradition: "Sufi Poetry" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", tradition: "Tech Visionary" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost", tradition: "American Poet" },
  { text: "Let yourself be silently drawn by the strange pull of what you really love.", author: "Rumi", tradition: "Sufi Mysticism" },
  { text: "We do not inherit the earth from our ancestors; we borrow it from our children.", author: "Native American Proverb", tradition: "Indigenous Wisdom" },
  { text: "If you want others to be happy, practice compassion. If you want to be happy, practice compassion.", author: "Dalai Lama XIV", tradition: "Tibetan Buddhism" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", tradition: "Traditional Wisdom" },
  { text: "Joy is not in things; it is in us.", author: "Richard Wagner", tradition: "German Composer" },
  { text: "Happiness is not a station you arrive at, but a manner of traveling.", author: "Margaret Lee Runbeck", tradition: "American Author" },
  { text: "The most wasted of days is one without laughter.", author: "E.E. Cummings", tradition: "American Poet" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", tradition: "Buddhist Teaching" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey", tradition: "Media Pioneer" },
  { text: "Everything you can imagine is real.", author: "Pablo Picasso", tradition: "Spanish Artist" },
  { text: "A joyful heart is the inevitable result of a heart burning with love.", author: "Mother Teresa", tradition: "Missionary of Charity" },
  { text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin", tradition: "French-Cuban Author" },
  { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung", tradition: "Swiss Psychiatrist" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl", tradition: "Logotherapy" },
  { text: "El que no vive para servir, no sirve para vivir. (Those who don't live to serve, don't serve to live.)", author: "Mother Teresa", tradition: "Spanish Proverb" },
  { text: "Flectere si nequeo superos, Acheronta movebo. (If I cannot bend heaven, I will move hell.)", author: "Virgil", tradition: "Roman Poetry" },
  { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain", tradition: "American Humorist" },
  { text: "Wherever you go, go with all your heart.", author: "Confucius", tradition: "Chinese Philosophy" },
  { text: "Keep your face to the sunshine and you cannot see a shadow.", author: "Helen Keller", tradition: "American Author" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien", tradition: "British Author" },
  { text: "In every walk with nature, one receives far more than he seeks.", author: "John Muir", tradition: "Naturalist" },
  { text: "The soul always knows what to do to heal itself. The challenge is to silence the mind.", author: "Caroline Myss", tradition: "Medical Intuitive" },
  { text: "Begin anywhere.", author: "John Cage", tradition: "Avant-garde Composer" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", tradition: "Transcendentalist" },
  { text: "Do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.", author: "Jesus", tradition: "Gospel of Matthew" },
  { text: "Blessed are the peacemakers, for they shall be called children of God.", author: "Jesus", tradition: "Sermon on the Mount" },
  { text: "Love your neighbor as yourself.", author: "Jesus", tradition: "Christian Teaching" },
  { text: "Make me an instrument of your peace. Where there is hatred, let me sow love.", author: "St. Francis of Assisi", tradition: "Christian Mystic" },
  { text: "This is the day the Lord has made; let us rejoice and be glad in it.", author: "Psalm 118", tradition: "Hebrew Scripture" },
  { text: "A joyful heart is good medicine, but a crushed spirit dries up the bones.", author: "Proverbs 17:22", tradition: "Book of Proverbs" },
  { text: "What is hateful to you, do not do to your neighbor. This is the whole Torah; the rest is commentary.", author: "Hillel the Elder", tradition: "Jewish Wisdom" },
  { text: "Who is rich? One who is happy with their portion.", author: "Pirkei Avot", tradition: "Ethics of the Fathers" },
  { text: "Verily, with hardship comes ease.", author: "Quran 94:6", tradition: "Islamic Scripture" },
  { text: "The best among you are those who have the best manners and character.", author: "Prophet Muhammad", tradition: "Hadith" },
  { text: "Kindness is a mark of faith, and whoever is not kind has no faith.", author: "Prophet Muhammad", tradition: "Islamic Teaching" },
  { text: "When the power of love overcomes the love of power, the world will know peace.", author: "Attributed to Sufi Wisdom", tradition: "Islamic Mysticism" },
  { text: "You are what your deep, driving desire is. As your desire is, so is your will. As your will is, so is your deed.", author: "Brihadaranyaka Upanishad", tradition: "Hindu Scripture" },
  { text: "When meditation is mastered, the mind is unwavering like the flame of a lamp in a windless place.", author: "Bhagavad Gita", tradition: "Hindu Scripture" },
  { text: "The soul is neither born, and nor does it die. It is unborn, eternal, ever-existing and primeval.", author: "Bhagavad Gita", tradition: "Hindu Philosophy" },
  { text: "Look within. Within is the fountain of good, and it will ever bubble up, if you will ever dig.", author: "Marcus Aurelius", tradition: "Stoic Philosophy" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu", tradition: "Chinese Wisdom" },
  { text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu", tradition: "Taoist Philosophy" },
  { text: "Before you embark on a journey of revenge, dig two graves.", author: "Confucius", tradition: "Chinese Philosophy" },
  { text: "The quieter you become, the more you can hear.", author: "Zen Proverb", tradition: "Japanese Zen" },
  { text: "Let go or be dragged.", author: "Zen Saying", tradition: "Japanese Wisdom" },
  { text: "The obstacle is the path.", author: "Zen Proverb", tradition: "Zen Buddhism" },
  { text: "Sitting quietly, doing nothing, spring comes, and the grass grows by itself.", author: "Matsuo Bashō", tradition: "Japanese Poet" },
];

const exercises = [
  {
    title: "Anapana Breath Awareness",
    subtitle: "Ancient Vipassana technique",
    steps: ["Sit comfortably with a straight spine", "Close your eyes gently", "Bring attention to the area below your nostrils", "Simply observe the natural breath - don't control it", "Notice the sensation of air entering and leaving", "When mind wanders, gently return to the breath"],
    practiceInstruction: "Feel the breath entering and leaving your nostrils. Is it entering your left, right, or both?",
    seedThought: "The breath is always here, waiting to bring you home"
  },
  {
    title: "Zen Koan Contemplation",
    subtitle: "Transcend ordinary thinking",
    steps: ["Sit quietly and center yourself", "Contemplate: 'What is the sound of one hand clapping?'", "Don't try to solve it logically", "Let the question sit in your awareness", "Notice what arises without grasping", "The koan bypasses the rational mind"],
    practiceInstruction: "Contemplate: What is the sound of one hand clapping?",
    seedThought: "Not all questions need answers; some are doorways"
  },
  {
    title: "Mountain Meditation",
    subtitle: "Jon Kabat-Zinn inspired",
    steps: ["Sit or stand with dignity", "Feel your connection to the earth below", "Imagine yourself as a mountain - solid, stable, grounded", "Storms may come and go, seasons change", "The mountain remains unmoved", "You are the mountain, not the weather passing over it"],
    practiceInstruction: "Feel yourself grounded and unshakeable like a mountain",
    seedThought: "Storms pass, seasons change, the mountain remains"
  },
  {
    title: "Lotus Blooming Meditation",
    subtitle: "Transformation visualization",
    steps: ["Close your eyes and breathe deeply", "Visualize yourself as a lotus bud in the mud", "Feel yourself rising through murky water", "Moving toward the light above", "Breaking the surface", "Opening your petals to the sun"],
    practiceInstruction: "Close your eyes. Visualize yourself as a lotus rising from mud, through water, blooming into light",
    seedThought: "From darkness to light, you are always blooming"
  },
  {
    title: "Open Awareness Practice",
    subtitle: "Choiceless attention",
    steps: ["Sit comfortably and relax", "Rather than focus on one thing, open your awareness", "Notice whatever arises: sounds, sensations, thoughts", "Don't follow or push away anything", "Be like the sky - let everything pass through"],
    practiceInstruction: "Let your awareness be open like the sky. Don't focus on anything - just notice whatever arises",
    seedThought: "You are the sky, not the clouds"
  },
  {
    title: "Mental Noting Practice",
    subtitle: "Mahasi Sayadaw technique",
    steps: ["Sit and begin observing your breath", "When anything arises, silently note it: 'thinking', 'feeling', 'hearing'", "Note sensations: 'tingling', 'pressure', 'warmth'", "Note emotions: 'joy', 'sadness', 'anxiety'", "Keep labels simple and objective", "Return to breath between notes"],
    practiceInstruction: "Silently label whatever arises: 'thinking', 'hearing', 'feeling', 'tingling', 'warmth'",
    seedThought: "Name it to see it clearly, then let it pass"
  },
  {
    title: "Just Sitting (Shikantaza)",
    subtitle: "Zen practice of pure presence",
    steps: ["Sit upright with dignity", "Don't focus on anything in particular", "Don't try to achieve anything", "Simply be completely present", "When thoughts arise, don't follow them", "Rest in the clarity of this moment"],
    practiceInstruction: "Sit with dignity, simply being present",
    seedThought: "Nothing to do, nowhere to go, already complete"
  },
  {
    title: "Breath Counting",
    subtitle: "Zen concentration practice",
    steps: ["Sit and bring attention to your breath", "Count 'one' on the exhale", "Count 'two' on the next exhale", "Continue counting up to ten", "When you reach ten, start over at one", "If you lose count, gently return to one"],
    practiceInstruction: "Count each exhale from one to ten. When you reach ten, start over at one",
    seedThought: "One breath, one count, one moment of peace"
  },
  {
    title: "Sound Meditation",
    subtitle: "Listen without labeling",
    steps: ["Sit quietly and close your eyes", "Let your ears open to all sounds", "Don't name the sounds - just hear them", "Notice sound as pure vibration", "Near sounds, far sounds, silence between", "Your awareness is the space sounds appear in"],
    practiceInstruction: "Close your eyes. Listen to all sounds - near and far - without naming or judging them",
    seedThought: "Silence is not the absence of sound, but the space that holds it"
  },
  {
    title: "Watching Thoughts",
    subtitle: "Observe the mind like clouds",
    steps: ["Sit comfortably and settle in", "Notice thoughts arising like clouds in the sky", "Don't engage with thoughts - just watch them", "Observe: thoughts come, thoughts go", "You are the sky, not the clouds", "Some clouds are dark, some bright - all pass"],
    practiceInstruction: "Notice thoughts arising like clouds. Don't engage with them - just watch them come and go",
    seedThought: "Thoughts are weather passing through; you are the sky"
  },
  {
    title: "Four Elements Meditation",
    subtitle: "Traditional contemplation",
    steps: ["Feel the solidity in your body (earth element)", "Notice fluidity, moisture, circulation (water element)", "Sense warmth and temperature (fire element)", "Feel movement, breath, space (wind element)", "Your body is made of these elements", "They arise and pass away naturally"],
    practiceInstruction: "Feel the solidity (earth), fluidity (water), warmth (fire), and movement (wind) in your body",
    seedThought: "You are not in nature, you ARE nature"
  },
  {
    title: "Impermanence Reflection",
    subtitle: "Wisdom through observation",
    steps: ["Sit and observe your breath", "Notice: each breath is unique and unrepeatable", "Observe sensations - they change constantly", "Watch thoughts - they appear and vanish", "Nothing stays the same even for a moment", "This is the nature of all things"],
    practiceInstruction: "Observe your breath, sensations, thoughts - notice they're all constantly changing",
    seedThought: "Everything changes, and that's why everything is precious"
  },
  {
    title: "Spacious Awareness",
    subtitle: "Rest in the vast mind",
    steps: ["Close your eyes and feel your body", "Now expand awareness to the room around you", "Expand further to include the building, the street", "Keep expanding to the city, the country, the planet", "Feel yourself as vast, spacious awareness", "Everything arises in this space"],
    practiceInstruction: "Let your awareness expand outward - room, building, city, earth, space",
    seedThought: "You are vast enough to hold the whole universe"
  },
  {
    title: "Mindful Listening",
    subtitle: "Deep presence with sound",
    steps: ["Choose a piece of music or natural sound", "Listen with complete attention", "Notice layers, textures, spaces between sounds", "Feel how sound affects your body", "Don't judge or analyze - just receive", "When mind wanders, return to listening"],
    practiceInstruction: "Choose a sound - music, nature, or ambient noise. Listen with complete attention to every layer and texture",
    seedThought: "To truly listen is to disappear into the listening"
  },
  {
    title: "Gap Between Thoughts",
    subtitle: "Recognize natural peace",
    steps: ["Sit quietly and watch your thoughts", "Notice the tiny gap between two thoughts", "That gap is naturally peaceful and aware", "Don't try to create gaps - just notice them", "These gaps are always there", "This is your natural mind before thinking"],
    practiceInstruction: "Watch your thoughts. Notice the tiny peaceful gap between one thought and the next",
    seedThought: "Peace lives in the pause between thoughts"
  },
  {
    title: "Present Moment Check-In",
    subtitle: "Quick mindfulness reset",
    steps: ["Pause whatever you're doing", "Ask: What's happening right now?", "Notice your body, breath, emotions", "Notice sounds, sights, sensations", "No need to change anything", "This moment is already complete"],
    practiceInstruction: "Stop and check in: What am I feeling? What do I hear? What's here right now?",
    seedThought: "This moment is already complete"
  },
  {
    title: "Progressive Muscle Relaxation",
    subtitle: "Release physical tension",
    steps: ["Sit or lie down comfortably", "Tense your toes for 5 seconds, then release", "Move up: calves, thighs, belly, chest", "Tense and release hands, arms, shoulders", "Finish with jaw and face muscles"],
    practiceInstruction: "Tense and release one part of your body: toes, legs, belly, arms, hands, face, or a choice of your own",
    seedThought: "Tension held creates pain; tension released creates peace"
  },
  {
    title: "Savoring Exercise",
    subtitle: "Amplify positive moments",
    steps: ["Find something pleasant happening now", "Close other tabs in your mind", "Notice every detail - sight, sound, feeling", "Let yourself fully enjoy this moment", "Store this memory for later"],
    practiceInstruction: "Find something pleasant happening right now. Close your eyes and notice every detail - fully savor it",
    seedThought: "Joy noticed is joy doubled"
  },
  {
    title: "Gratitude Visualization",
    subtitle: "Shift to abundance",
    steps: ["Close eyes, take 3 deep breaths", "Picture someone you love smiling", "Feel warmth in your chest", "Think of 3 things you're grateful for", "Let a gentle smile form"],
    practiceInstruction: "Close your eyes. Take 3 deep breaths. Think of three things you're grateful for right now",
    seedThought: "Gratitude turns what we have into enough"
  },
  {
    title: "Loving-Kindness Meditation",
    subtitle: "Buddhist practice for joy",
    steps: ["Place hand on heart", "Say: May I be happy, healthy, safe", "Wish the same to someone you love", "Extend to a neutral person", "Extend to someone difficult", "Finally, wish this for all beings"],
    practiceInstruction: "Place hand on heart. Say: May I be happy, healthy, safe. Then wish the same for someone you love",
    seedThought: "Love given freely returns multiplied"
  },
  {
    title: "Body Scan Release",
    subtitle: "Release hidden tension",
    steps: ["Start at top of head", "Notice tension in forehead, jaw", "With each exhale, let it melt", "Move down: neck, chest, belly, legs", "End at feet, feeling grounded"],
    practiceInstruction: "Scan your body. Where do you feel the most tension? Breathe into it and let it go",
    seedThought: "Your body remembers to relax when you remember to listen"
  },
  {
    title: "Safe Place Visualization",
    subtitle: "Create inner sanctuary",
    steps: ["Close your eyes and breathe deeply", "Imagine a place where you feel completely safe", "It can be real or imaginary", "Notice the colors, sounds, temperature", "Feel the peace of this place", "Know you can return here anytime"],
    practiceInstruction: "Close your eyes. Imagine a place where you feel completely safe. Notice the colors, sounds, temperature",
    seedThought: "Peace is always one breath away"
  },
  {
    title: "Mindful Moment",
    subtitle: "Quick reset anywhere",
    steps: ["Stop and close your eyes", "Take 1 slow, full breath", "Notice 1 thing you can hear", "Notice 1 sensation on your body", "Notice 1 thing you're grateful for"],
    practiceInstruction: "Take 1 slow, full breath. Notice 1 thing you hear. Notice 1 sensation on your body. Notice 1 thing you're grateful for",
    seedThought: "This moment can change everything"
  },
  {
    title: "Joy Recall",
    subtitle: "Relive your happiest moments",
    steps: ["Close your eyes and relax", "Remember a moment of pure joy", "Where were you? Who was there?", "Feel the emotions fully again", "Let a smile spread across your face"],
    practiceInstruction: "Recall your happiest memory. Let yourself feel it completely",
    seedThought: "Joy remembered is joy relived"
  },
  {
    title: "Smile Meditation",
    subtitle: "The happiness feedback loop",
    steps: ["Sit comfortably and close your eyes", "Gently smile — even if you don't feel it", "Notice how your face muscles feel", "Let the smile soften your eyes", "Feel warmth spreading through you"],
    practiceInstruction: "Smile softly. Let it reach your eyes. Feel what happens in your body",
    seedThought: "A smile is a curve that sets everything straight"
  },
  {
    title: "GLAD Technique",
    subtitle: "Find daily wins",
    steps: ["G — One GOOD thing today", "L — One thing you LEARNED", "A — One small ACCOMPLISHMENT", "D — One thing that DELIGHTED you"],
    practiceInstruction: "Think of one thing today that was: Good, something you Learned, something you Accomplished, or something that Delighted you",
    seedThought: "What you appreciate, appreciates"
  },
  {
    title: "Three Good Things",
    subtitle: "Rewire your brain for positivity",
    steps: ["Think of one good thing from today", "It can be tiny: a warm cup of tea, a kind word, a moment of sunshine", "Ask yourself: Why did this happen?", "This trains your brain to notice more good"],
    practiceInstruction: "Think of one good thing from today. It can be tiny: a warm cup of tea, a kind word, a moment of sunshine",
    seedThought: "Where attention goes, happiness grows"
  },
  {
    title: "Acts of Kindness Practice",
    subtitle: "Boost happiness through giving",
    steps: ["Think of one small kind act you can do today", "It can be tiny: hold a door, send a text, smile", "Do it without expecting anything back", "Notice how it feels in your body"],
    practiceInstruction: "Think of one small kind act you can do today. It can be tiny: hold a door, send a text, smile at someone",
    seedThought: "Kindness is a spark that lights two hearts"
  },
  {
    title: "Autogenic Training",
    subtitle: "Mind-body relaxation technique",
    steps: ["Sit or lie down comfortably", "Choose one body part: arm, leg, or belly", "Silently repeat: 'My [body part] is heavy'", "Feel the heaviness spreading", "Then repeat: 'My [body part] is warm'", "Feel the warmth flowing through"],
    practiceInstruction: "Choose one body part. Silently repeat: 'My [arm/leg/belly] is heavy' or 'My [arm/leg/belly] is warm'",
    seedThought: "What the mind suggests, the body follows"
  },
  {
    title: "Inner Light Practice",
    subtitle: "Prayer hands mudra",
    steps: ["Bring your palms together at your heart", "Close your eyes and feel your heartbeat", "Raise your hands to the space between your eyebrows", "Feel your inner light gathering there", "Release your hands and open them", "Let that light flow out to the world"],
    practiceInstruction: "Hold your hands in prayer. Bring them to the space between your eyebrows. Feel your inner light gather there. Release your hands and share that light with the world",
    seedThought: "The light within you is meant to be shared"
  },
  {
    title: "Relaxation Response",
    subtitle: "Mantra meditation practice",
    steps: ["Sit comfortably and close your eyes", "Choose your word of power: love, peace, joy, calm, or a sacred name", "Begin repeating it silently", "With each repetition, let it get softer", "Softer... quieter... dissolving", "Until the word plants itself in your consciousness"],
    practiceInstruction: "Pick your word of power: love, peace, joy, or another meaningful word. Repeat it silently, each time softer and softer, until the word plants itself in your mind",
    seedThought: "Words repeated softly with love will bloom in your soul"
  },
  {
    title: "Dream Garden",
    subtitle: "Plant seeds of joy in your mind",
    steps: ["Close your eyes and take three slow breaths", "Imagine a beautiful garden in your mind", "Think of one thing that would bring you joy", "Visualize it as a seed of light", "Gently plant it in the garden of your mind", "Watch it take root with warmth and care", "Carry this seed with you throughout your day"],
    practiceInstruction: "Close your eyes. Visualize a beautiful garden. Plant one seed of something that would bring you joy. Watch it gently take root in your mind.",
    seedThought: "The dreams you plant today bloom into tomorrow's reality"
  },
  {
    title: "Seeds Of Tomorrow",
    subtitle: "Dream your joy into being",
    steps: ["Sit comfortably and close your eyes", "Take a deep breath and smile gently", "Picture one joyful moment you'd love to experience", "See it clearly - colors, feelings, details", "Imagine planting this vision as a glowing seed", "Feel it settling into your heart", "Open your eyes, carrying this seed of possibility"],
    practiceInstruction: "Close your eyes. Picture something that would bring you joy tomorrow. Plant that vision like a seed, trusting it will grow.",
    seedThought: "What you dream with intention becomes what you live with grace"
  },
  {
    title: "Dreamweaver",
    subtitle: "Weave joy into your tomorrow",
    steps: ["Close your eyes and breathe softly", "Let yourself drift into a peaceful state", "Imagine your ideal tomorrow - one joyful moment", "See it, feel it, breathe it in", "Let this dream weave itself into your consciousness", "Release any attachment, just hold it lightly", "Trust that what you dream with love takes root"],
    practiceInstruction: "Close your eyes. See yourself in a moment of pure joy. Hold that vision gently, like a dream taking shape. Let it settle into your being.",
    seedThought: "You are the dreamer and the dream, planting joy one vision at a time"
  },
  {
    title: "Find Your Spark",
    subtitle: "Mirror meditation",
    steps: ["Imagine you are looking into your own eyes in a mirror", "See past the face you know", "Find the light that's always been there", "That spark? That's you", "That's joy"],
    practiceInstruction: "Imagine you are looking into your own eyes in a mirror. See past the face you know. Find the light that's always been there. That spark? That's you. That's joy.",
    seedThought: "That spark was always there. Now you know where to find it"
  },
];

// Breathwork patterns for stress relief and emotional regulation
const breathworkPatterns = [
  {
    name: "Box Breathing",
    subtitle: "Tactical calm for stress",
    description: "Used by Navy SEALs to stay calm under pressure",
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    emoji: "📦",
    benefits: ["Reduces anxiety", "Improves focus", "Lowers stress"],
    duration: 16,
  },
  {
    name: "4-7-8 Breathing",
    subtitle: "Sleep ease technique",
    description: "Dr. Andrew Weil's method for deep relaxation",
    pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
    emoji: "😴",
    benefits: ["Promotes sleep", "Calms nervous system", "Reduces tension"],
    duration: 19,
  },
  {
    name: "Heart Coherence",
    subtitle: "Heart-brain harmony",
    description: "Balance your heart rhythm and emotions",
    pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 },
    emoji: "💗",
    benefits: ["Emotional balance", "Improves HRV", "Reduces stress"],
    duration: 10,
  },
  {
    name: "Resonant Breathing",
    subtitle: "Deep calm state",
    description: "Optimal breathing for heart rate variability",
    pattern: { inhale: 6, hold1: 0, exhale: 6, hold2: 0 },
    emoji: "🌊",
    benefits: ["Maximum HRV", "Deep relaxation", "Mental clarity"],
    duration: 12,
  },
  {
    name: "Triangle Breathing",
    subtitle: "Balance breath",
    description: "Simple pattern for quick centering",
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 0 },
    emoji: "🔺",
    benefits: ["Quick reset", "Improves balance", "Calms mind"],
    duration: 12,
  },
  {
    name: "Coherent Breathing",
    subtitle: "Optimal flow state",
    description: "5.5 breaths per minute for peak coherence",
    pattern: { inhale: 5, hold1: 1, exhale: 5, hold2: 1 },
    emoji: "✨",
    benefits: ["Peak performance", "Deep coherence", "Stress relief"],
    duration: 12,
  },
];

// CBT exercises for when someone selects "Nothing" (not feeling happy)
const cbtExercises = [
  {
    title: "Smile Breath",
    subtitle: "Reset with your breath",
    steps: [
      "Take a deep breath in for 4 counts",
      "Hold for 4 counts",
      "Breathe out slowly for 6 counts",
      "As you breathe out, let a small smile form on your lips",
      "Repeat 3 times",
      "Notice how you feel now"
    ],
    pattern: { inhale: 4, hold: 4, exhale: 6 }
  },
  { title: "Name It to Tame It", subtitle: "Reduce emotional intensity", steps: ["Take a deep breath", "Name the emotion you're feeling out loud", "Say: 'I notice I'm feeling [emotion]'", "This simple act reduces the emotion's power", "Remember: feelings are visitors, not permanent residents"], pattern: null },
  { title: "The 5-4-3-2-1 Grounding", subtitle: "Return to the present moment", steps: ["Name 5 things you can see", "Name 4 things you can touch", "Name 3 things you can hear", "Name 2 things you can smell", "Name 1 thing you can taste", "Notice how you feel more present"], pattern: null },
  { title: "Thought Diffusion", subtitle: "Distance yourself from negative thoughts", steps: ["Notice a negative thought", "Add this phrase: 'I'm having the thought that...'", "Example: 'I'm having the thought that I'm not good enough'", "This creates space between you and the thought", "You are not your thoughts"], pattern: null },
  { title: "Evidence Examination", subtitle: "Challenge negative beliefs", steps: ["Write down a negative thought", "Ask: What evidence supports this?", "Ask: What evidence contradicts this?", "Ask: What would I tell a friend thinking this?", "Replace with a more balanced thought"], pattern: null },
  { title: "Opposite Action", subtitle: "Do the opposite of your mood urge", steps: ["Notice what your mood wants you to do", "If you want to isolate, reach out to someone", "If you want to stay in bed, get up and move", "If you want to avoid, face it gently", "Acting opposite to the mood often shifts it"], pattern: null },
  { title: "Self-Compassion Break", subtitle: "Treat yourself with kindness", steps: ["Place your hand on your heart", "Say: 'This is a moment of suffering'", "Say: 'Suffering is part of being human'", "Say: 'May I be kind to myself'", "Feel the warmth of your own hand"], pattern: null },
  { title: "Reframe the Narrative", subtitle: "Change the story you're telling", steps: ["Identify the story you're telling yourself", "Ask: Is this the only way to see this?", "Consider: What else could be true?", "Find a more helpful perspective", "You get to choose the lens you see through"], pattern: null },
  { title: "Value-Based Action", subtitle: "One small step aligned with who you want to be", steps: ["Think of one value important to you", "Examples: kindness, courage, connection", "Do ONE tiny action aligned with that value", "Even when you don't feel like it", "Values create meaning when motivation is low"], pattern: null },
];


// CBT Tools matched to end-streak reasons
const cbtTools = {
  work: {
    title: "Decatastrophizing",
    subtitle: "Put work stress in perspective",
    steps: [
      "What's the WORST that could realistically happen?",
      "What's the BEST that could happen?",
      "What's MOST LIKELY to happen?",
      "How will this matter in 1 week? 1 year?",
      "What's one small thing you can control right now?"
    ]
  },
  relationship: {
    title: "Best Friend Technique",
    subtitle: "Treat yourself like you'd treat a friend",
    steps: [
      "Imagine a close friend in your exact situation",
      "What would you say to comfort them?",
      "What advice would you give them?",
      "Now say those same words to yourself",
      "You deserve the same compassion you give others"
    ]
  },
  health: {
    title: "Self-Compassion Break",
    subtitle: "Be gentle with yourself",
    steps: [
      "Say: 'This is a moment of suffering'",
      "Say: 'Suffering is part of being human'",
      "Place your hand on your heart",
      "Say: 'May I be kind to myself'",
      "Say: 'May I give myself the compassion I need'"
    ]
  },
  anxiety: {
    title: "5-4-3-2-1 Grounding",
    subtitle: "Come back to the present moment",
    steps: [
      "Name 5 things you can SEE right now",
      "Name 4 things you can TOUCH or feel",
      "Name 3 things you can HEAR",
      "Name 2 things you can SMELL",
      "Name 1 thing you can TASTE",
      "Take a deep breath — you are here, you are safe"
    ]
  },
  news: {
    title: "Circle of Control",
    subtitle: "Focus on what you can influence",
    steps: [
      "Draw two circles in your mind",
      "OUTER circle: things you CAN'T control",
      "INNER circle: things you CAN control",
      "The news belongs in the outer circle",
      "What's ONE thing in your inner circle you can do?",
      "Put your energy there instead"
    ]
  },
  money: {
    title: "Decatastrophizing",
    subtitle: "Put financial stress in perspective",
    steps: [
      "What's the WORST that could realistically happen?",
      "What's the BEST that could happen?",
      "What's MOST LIKELY to happen?",
      "Have you survived money stress before? You're resilient.",
      "What's one tiny step you can take today?"
    ]
  },
  tired: {
    title: "Behavioral Activation",
    subtitle: "One tiny step forward",
    steps: [
      "When exhausted, our brain says 'do nothing'",
      "But small actions create energy, not drain it",
      "Pick ONE tiny thing (2 minutes or less)",
      "Examples: drink water, step outside, stretch",
      "Notice how you feel after — even slightly better counts",
      "Small wins build momentum"
    ]
  },
  conflict: {
    title: "Thought Reframe",
    subtitle: "Challenge the harsh narrative",
    steps: [
      "What thought is bothering you most?",
      "Is this thought 100% true? What's the evidence?",
      "What would a neutral observer say?",
      "Is there another way to see this situation?",
      "Write a more balanced thought",
      "Example: 'We disagreed' vs 'They hate me'"
    ]
  }
};

// Default CBT tool if no reason selected
const defaultCbtTool = {
  title: "Self-Compassion Break",
  subtitle: "A moment of kindness for yourself",
  steps: [
    "Acknowledge: 'This is hard right now'",
    "Remember: 'Everyone struggles sometimes'",
    "Place your hand on your heart",
    "Say: 'May I be kind to myself'",
    "Take a deep breath and begin again"
  ]
};

// Time-of-day ritual configuration
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'morning';  // Morning ritual: 5am-10am
  if (hour >= 10 && hour < 17) return 'afternoon';  // Afternoon: 10am-5pm
  if (hour >= 17 && hour < 22) return 'evening';  // Evening ritual: 5pm-10pm
  return 'night';  // Night ritual: 10pm-5am
};

const timeRituals = {
  morning: {
    emoji: '🌅',
    greeting: 'Good morning!',
    title: 'Morning Ritual',
    checkinPrompt: "Let's check in for the morning",
    sourcePrompt: "What's energizing you this morning?",
    color: 'amber',
    sources: [
      { id: 'rest', label: '😴 Good sleep', prompt: 'restful sleep' },
      { id: 'peace', label: '☀️ Fresh start', prompt: 'this new day' },
      { id: 'relationship', label: '💕 Loved ones', prompt: 'your loved ones' },
      { id: 'health', label: '🏃 Morning energy', prompt: 'your energy' },
      { id: 'nature', label: '🌿 Nature/Weather', prompt: 'nature' },
      { id: 'anticipation', label: '✨ Looking forward', prompt: 'what lies ahead' },
      { id: 'gratitude', label: '🙏 Simply grateful', prompt: 'being alive' },
      { id: 'coffee', label: '☕ Morning ritual', prompt: 'your morning ritual' },
    ]
  },
  afternoon: {
    emoji: '☀️',
    greeting: 'Good afternoon!',
    title: 'Midday Check-in',
    checkinPrompt: "Let's check in - how's your day going?",
    sourcePrompt: "What's going well today?",
    color: 'yellow',
    sources: [
      { id: 'work', label: '💼 Work going well', prompt: 'work' },
      { id: 'achievement', label: '🎯 Got something done', prompt: 'this achievement' },
      { id: 'relationship', label: '💕 Good conversation', prompt: 'connection' },
      { id: 'health', label: '🏃 Staying active', prompt: 'movement' },
      { id: 'food', label: '🍽️ Good meal', prompt: 'nourishment' },
      { id: 'peace', label: '😌 Moment of calm', prompt: 'inner peace' },
      { id: 'fun', label: '🎉 Fun break', prompt: 'this moment of fun' },
      { id: 'progress', label: '📈 Making progress', prompt: 'progress' },
    ]
  },
  evening: {
    emoji: '🌆',
    greeting: 'Good evening!',
    title: 'Evening Reflection',
    checkinPrompt: "Let's check in for the evening",
    sourcePrompt: "What made today good?",
    color: 'orange',
    sources: [
      { id: 'accomplishment', label: '✅ What I accomplished', prompt: 'your accomplishments' },
      { id: 'relationship', label: '💕 Time with loved ones', prompt: 'your loved ones' },
      { id: 'rest', label: '🛋️ Relaxing now', prompt: 'rest' },
      { id: 'health', label: '🏃 Moved my body', prompt: 'taking care of yourself' },
      { id: 'food', label: '🍽️ Good dinner', prompt: 'nourishment' },
      { id: 'fun', label: '🎉 Had some fun', prompt: 'fun moments' },
      { id: 'growth', label: '📚 Learned something', prompt: 'growth' },
      { id: 'peace', label: '😌 Peaceful evening', prompt: 'peace' },
    ]
  },
  night: {
    emoji: '🌙',
    greeting: 'Good night!',
    title: 'Night Wind-down',
    checkinPrompt: "Let's wind down and reflect on your day",
    sourcePrompt: "What's bringing you peace tonight?",
    color: 'indigo',
    sources: [
      { id: 'rest', label: '😴 Ready for sleep', prompt: 'rest' },
      { id: 'peace', label: '😌 Inner calm', prompt: 'peace' },
      { id: 'relationship', label: '💕 Loved ones safe', prompt: 'your loved ones' },
      { id: 'gratitude', label: '🙏 Today was enough', prompt: 'today' },
      { id: 'comfort', label: '🛏️ Cozy & comfortable', prompt: 'comfort' },
      { id: 'reflection', label: '💭 Good thoughts', prompt: 'reflection' },
      { id: 'tomorrow', label: '✨ Tomorrow awaits', prompt: 'tomorrow' },
      { id: 'letting-go', label: '🍃 Letting go', prompt: 'release' },
    ]
  }
};

// Regular check-in (used for afternoon + after ritual is done)
const regularCheckin = {
  emoji: '😊',
  greeting: 'Happiness Check-in',
  title: 'Check-in',
  checkinPrompt: "Let's track what's making you smile right now",
  sourcePrompt: "What's bringing you happiness right now?",
  color: 'green',
  sources: [
    { id: 'work', label: '💼 Work going well', prompt: 'work' },
    { id: 'relationship', label: '💕 Loved ones', prompt: 'your loved ones' },
    { id: 'health', label: '🏃 Health/Exercise', prompt: 'your health' },
    { id: 'peace', label: '😌 Inner peace', prompt: 'inner peace' },
    { id: 'nature', label: '🌿 Nature/Outdoors', prompt: 'nature' },
    { id: 'achievement', label: '🎯 Achievement', prompt: 'this achievement' },
    { id: 'fun', label: '🎉 Fun/Play', prompt: 'this moment of fun' },
    { id: 'rest', label: '😴 Good rest', prompt: 'rest' },
  ]
};

// Helper to check if ritual was done today
const getTodayKey = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isRitualDoneToday = (ritualType) => {
  const key = `ritualDone_${ritualType}_${getTodayKey()}`;
  return localStorage.getItem(key) === 'true';
};

const markRitualDone = (ritualType) => {
  const key = `ritualDone_${ritualType}_${getTodayKey()}`;
  localStorage.setItem(key, 'true');
};

// Determine which check-in experience to show
const getCheckinConfig = () => {
  const timeOfDay = getTimeOfDay();
  
  // Afternoon is always regular (unlimited)
  if (timeOfDay === 'afternoon') {
    return { ritual: regularCheckin, isRitual: false, timeOfDay };
  }
  
  // Morning/Evening/Night - check if ritual done today
  if (isRitualDoneToday(timeOfDay)) {
    // Ritual already done, show regular check-in
    return { ritual: regularCheckin, isRitual: false, timeOfDay };
  }
  
  // Ritual not done yet, show the special ritual
  return { ritual: timeRituals[timeOfDay], isRitual: true, timeOfDay };
};

// Simplified badges - Day Streak based
const streakBadges = [
  { id: 'started', name: 'Getting Started', threshold: 1, icon: '🌱' },
  { id: 'streak-3', name: '3 Day Streak', threshold: 3, icon: '🔥' },
  { id: 'streak-7', name: 'Week Warrior', threshold: 7, icon: '⚡' },
  { id: 'streak-14', name: 'Two Week Champion', threshold: 14, icon: '💪' },
  { id: 'streak-30', name: 'Monthly Master', threshold: 30, icon: '🌟' },
  { id: 'streak-60', name: 'Unstoppable', threshold: 60, icon: '✨' },
  { id: 'streak-100', name: 'Legendary', threshold: 100, icon: '👑' },
];

// Milestone thresholds for celebrations
const milestoneThresholds = [3, 7, 14, 21, 30, 60, 100, 365];

// Confetti Component
function Confetti({ active }) {
  if (!active) return null;
  
  const colors = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#a78bfa', '#f87171'];
  const confetti = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map(c => (
        <div
          key={c.id}
          className="absolute animate-bounce"
          style={{
            left: `${c.left}%`,
            top: '-20px',
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${c.duration}s ease-out ${c.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Toast Notification - Random encouragements
function Toast({ message, emoji, isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000); // Auto-hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <p className="text-white font-medium">{message}</p>
        </div>
      </div>
      <style>{`
        @keyframes slide-down {
          0% { transform: translate(-50%, -100px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Milestone Celebration Modal
function MilestoneCelebration({ isOpen, onClose, streak, badge, onShare, onChallenge, addPoints }) {
  if (!isOpen) return null;

  const shareText = `🎉 I just hit a ${streak}-day happiness streak!\n\n${badge?.icon} ${badge?.name}\n\nLet's make happiness addictively fun! 🎮✨\n\n${APP_URL}`;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-sm w-full p-6 border border-yellow-400/30 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-6xl mb-4">{badge?.icon || '🎉'}</div>
        <h2 className="text-2xl font-bold mb-2">Amazing!</h2>
        <p className="text-yellow-400 text-lg font-semibold mb-1">{streak} Day Streak!</p>
        <p className="text-slate-400 mb-6">{badge?.name || 'Keep it going!'}</p>

        <div className="space-y-3">
          <button
            onClick={() => {
              shareContent(shareText, 'Copied to clipboard! 📋', () => {
                if (addPoints) addPoints(POINTS.SHARE_ACHIEVEMENT);
              });
              onShare?.();
            }}
            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold py-3 rounded-xl hover:scale-105 transition"
          >
            📤 Share Achievement
          </button>
          <button
            onClick={onChallenge}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition"
          >
            🎯 Challenge a Friend
          </button>
          <button onClick={onClose} className="w-full text-slate-400 py-2">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// Smile with a Friend Modal
function ChallengeModal({ isOpen, onClose }) {
  const [days, setDays] = useState(7);

  if (!isOpen) return null;

  const inviteText = `😊 Let's smile together for ${days} days!\n\nI'm building joy points and discovering happiness boosts. Want to join me?\n\nLet's make happiness addictively fun: ${APP_URL}`;

  const sendInvite = () => {
    shareContent(inviteText, 'Invitation copied! Send it to a friend 💛');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-sm w-full p-6 border border-amber-400/30" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">😊</div>
          <h2 className="text-xl font-bold">Smile with a Friend</h2>
          <p className="text-slate-400 text-sm">Share the happiness</p>
        </div>

        <p className="text-slate-300 text-sm mb-3 text-center">Invite them to smile together for:</p>
        <div className="flex gap-2 justify-center mb-6">
          {[7, 14, 21, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl font-semibold transition ${days === d ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-300'}`}
            >
              {d} days
            </button>
          ))}
        </div>

        <button
          onClick={sendInvite}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition mb-3"
        >
          💛 Send Invitation
        </button>
        <button onClick={onClose} className="w-full text-slate-400 text-sm">
          Cancel
        </button>
      </div>
    </div>
  );
}

// Happiness Insights - Pattern Discovery Modal
function HappinessInsights({ isOpen, onClose, checkins, streak, addPoints }) {
  if (!isOpen) return null;

  // Analyze time of day pattern
  const timePatterns = checkins.reduce((acc, c) => {
    const hour = new Date(c.timestamp).getHours();
    if (hour >= 5 && hour < 12) acc.morning++;
    else if (hour >= 12 && hour < 17) acc.midday++;
    else if (hour >= 17 && hour < 22) acc.evening++;
    else acc.night++;
    return acc;
  }, { morning: 0, midday: 0, evening: 0, night: 0 });

  const totalCheckins = Object.values(timePatterns).reduce((a, b) => a + b, 0);
  const dominantTime = Object.entries(timePatterns).sort((a, b) => b[1] - a[1])[0];

  const timeInsights = {
    morning: { icon: '🌅', name: 'Morning Person', desc: 'You shine brightest with the sunrise', color: 'from-yellow-400 to-orange-500' },
    midday: { icon: '☀️', name: 'Midday Maven', desc: 'Peak happiness in the afternoon glow', color: 'from-orange-400 to-amber-500' },
    evening: { icon: '🌆', name: 'Evening Enthusiast', desc: 'You bloom as the day winds down', color: 'from-purple-400 to-pink-500' },
    night: { icon: '🌙', name: 'Night Owl', desc: 'Happiness finds you in the quiet hours', color: 'from-indigo-400 to-purple-500' }
  };

  const timeInsight = timeInsights[dominantTime[0]];
  const timePercentage = Math.round((dominantTime[1] / totalCheckins) * 100);

  // Analyze top happiness source
  const sourceCounts = checkins.reduce((acc, c) => {
    const sources = c.sources || (c.source ? [c.source] : []);
    sources.forEach(s => {
      if (s !== 'nothing' && s !== 'recovery') acc[s] = (acc[s] || 0) + 1;
    });
    return acc;
  }, {});

  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
  const topSourceLabel = topSource ? (sourceLabels[topSource[0]] || topSource[0]) : 'moments of joy';
  const topSourceCount = topSource ? topSource[1] : 0;

  // Analyze check-in rhythm
  const dailyCounts = checkins.reduce((acc, c) => {
    const day = getDayKey(c.timestamp);
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const avgPerDay = Object.values(dailyCounts).reduce((a, b) => a + b, 0) / Object.keys(dailyCounts).length;
  const rhythmInsight = avgPerDay > 2.5
    ? { icon: '⚡', name: 'Burst of Joy', desc: 'You celebrate happiness in waves' }
    : { icon: '🎯', name: 'Steady Presence', desc: 'You build happiness with consistency' };

  const shareText = `✨ My ${streak}-Day Happiness Patterns\n\n${timeInsight.icon} ${timeInsight.name}\n${timePercentage}% of check-ins during ${dominantTime[0]} time\n\n💛 Top Source: ${topSourceLabel}\n${topSourceCount} moments of pure joy\n\n${rhythmInsight.icon} ${rhythmInsight.name}\n\nLet's make happiness addictively fun! ${APP_URL}`;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-md w-full p-6 border border-purple-400/30 text-center animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="text-5xl mb-3">🔮</div>
        <h2 className="text-2xl font-bold mb-2">Your Happiness Patterns</h2>
        <p className="text-slate-400 text-sm mb-6">{streak} days of insights unlocked</p>

        {/* Time Pattern */}
        <div className={`bg-gradient-to-r ${timeInsight.color} bg-opacity-10 border border-white/20 rounded-2xl p-5 mb-4`}>
          <div className="text-4xl mb-2">{timeInsight.icon}</div>
          <h3 className="text-xl font-bold mb-1">{timeInsight.name}</h3>
          <p className="text-slate-300 text-sm mb-3">{timeInsight.desc}</p>
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-white to-white/80 h-full rounded-full transition-all duration-1000"
              style={{ width: `${timePercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{timePercentage}% of your check-ins</p>
        </div>

        {/* Top Source */}
        <div className="bg-pink-500/10 border border-pink-400/30 rounded-2xl p-5 mb-4">
          <div className="text-3xl mb-2">💛</div>
          <h3 className="text-lg font-bold mb-1">Your Joy Magnet</h3>
          <p className="text-pink-300 text-xl font-semibold mb-1">{topSourceLabel}</p>
          <p className="text-slate-400 text-sm">{topSourceCount} beautiful moments</p>
        </div>

        {/* Rhythm */}
        <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-5 mb-6">
          <div className="text-3xl mb-2">{rhythmInsight.icon}</div>
          <h3 className="text-lg font-bold mb-1">{rhythmInsight.name}</h3>
          <p className="text-slate-300 text-sm">{rhythmInsight.desc}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              shareContent(shareText, 'Copied to clipboard! 📋', () => {
                if (addPoints) addPoints(POINTS.SHARE_PATTERNS);
              });
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition"
          >
            📤 Share My Patterns
          </button>
          <button onClick={onClose} className="w-full text-slate-400 py-2">
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// Weekly Reflection Modal
function WeeklyReflection({ isOpen, onClose, checkins, onShare }) {
  if (!isOpen) return null;

  // Get checkins from last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCheckins = checkins.filter(c => new Date(c.timestamp).getTime() > weekAgo);
  
  // Count sources
  const sourceCounts = weekCheckins.reduce((acc, c) => {
    const sources = c.sources || (c.source ? [c.source] : []);
    sources.forEach(s => { acc[s] = (acc[s] || 0) + 1; });
    return acc;
  }, {});
  
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const totalCheckins = weekCheckins.length;
  const daysActive = new Set(weekCheckins.map(c => new Date(c.timestamp).toDateString())).size;

  const shareText = `📊 My Happiness Week in Review\n\n✅ ${totalCheckins} check-ins\n📅 ${daysActive} days active\n\nTop sources:\n${topSources.map(([s, c], i) => `${['🥇', '🥈', '🥉'][i]} ${sourceLabels[s] || s}`).join('\n')}\n\nLet's make happiness addictively fun! ${APP_URL}`;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-sm w-full p-6 border border-blue-400/30" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">📊</div>
          <h2 className="text-xl font-bold">Your Week in Review</h2>
          <p className="text-slate-400 text-sm">Last 7 days of happiness</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{totalCheckins}</div>
            <div className="text-xs text-slate-400">Check-ins</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{daysActive}</div>
            <div className="text-xs text-slate-400">Days Active</div>
          </div>
        </div>

        {topSources.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 text-center">Top Happiness Sources</p>
            <div className="space-y-2">
              {topSources.map(([source, count], i) => (
                <div key={source} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                  <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                  <span className="flex-1 text-sm">{sourceLabels[source] || source}</span>
                  <span className="text-xs text-slate-400">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => { shareContent(shareText); onShare?.(); }}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition mb-3"
        >
          📤 Share My Week
        </button>
        <button onClick={onClose} className="w-full text-slate-400 text-sm">
          Close
        </button>
      </div>
    </div>
  );
}

// Sound Effects System - Web Audio API
const createSound = () => {
  if (typeof window === 'undefined' || !window.AudioContext) return null;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const playSound = (frequency, duration, type = 'sine') => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  return {
    // Gentle ding for check-in
    checkIn: () => {
      playSound(523.25, 0.2); // C5
      setTimeout(() => playSound(659.25, 0.15), 100); // E5
    },
    // Soft chime for points
    points: () => {
      playSound(659.25, 0.15); // E5
    },
    // Sparkle for power boost
    powerBoost: () => {
      playSound(523.25, 0.1); // C5
      setTimeout(() => playSound(659.25, 0.1), 50); // E5
      setTimeout(() => playSound(783.99, 0.15), 100); // G5
    },
    // Celebration bells for milestone
    milestone: () => {
      playSound(523.25, 0.2); // C5
      setTimeout(() => playSound(659.25, 0.2), 100); // E5
      setTimeout(() => playSound(783.99, 0.2), 200); // G5
      setTimeout(() => playSound(1046.50, 0.3), 300); // C6
    },
    // Breathing phase bell - gentle guidance
    breathInhale: () => {
      playSound(659.25, 0.25); // E5 - slightly longer for breath transitions
    },
    breathExhale: () => {
      playSound(523.25, 0.25); // C5 - lower tone for exhale
    },
  };
};

const soundSystem = createSound();

// Dynamic - always uses current year
const CURRENT_YEAR = new Date().getFullYear();

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://smileswithyou.com';

const shareContent = async (text, fallbackMessage = 'Copied to clipboard! 📋', onSuccess = null) => {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      if (onSuccess) onSuccess();
      return true;
    } catch { return false; }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      alert(fallbackMessage);
      if (onSuccess) onSuccess();
      return true;
    } catch { return false; }
  }
};

const shareQuote = (quote, addPoints) => {
  const text = `🌱 A seed of thought:\n\n"${quote.text}"\n— ${quote.author}\n\n${APP_URL}`;
  return shareContent(text, 'Copied to clipboard! 📋', () => {
    if (addPoints) addPoints(POINTS.SHARE_QUOTE);
  });
};

const shareExercise = (exercise, addPoints) => {
  let text = `🧘 Try this when you need calm:\n\n${exercise.title}\n${exercise.subtitle}\n\n`;
  if (exercise.pattern) {
    text += `Inhale ${exercise.pattern.inhale}s`;
    if (exercise.pattern.hold1) text += ` → Hold ${exercise.pattern.hold1}s`;
    text += ` → Exhale ${exercise.pattern.exhale}s`;
    if (exercise.pattern.hold2) text += ` → Hold ${exercise.pattern.hold2}s`;
    text += '\n\n';
  }
  text += APP_URL;
  return shareContent(text, 'Copied to clipboard! 📋', () => {
    if (addPoints) addPoints(POINTS.SHARE_EXERCISE);
  });
};

// Global Counter Component - Shows worldwide users + micro-moment
function GlobalCounter() {
  const [stats, setStats] = useState({
    activeStreaks: 0,
    totalCheckins: 0,
    todayCheckins: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentMoment, setCurrentMoment] = useState(() =>
    microMoments[Math.floor(Math.random() * microMoments.length)]
  );

  useEffect(() => {
    const unsubscribe = onValue(globalCounterRef, (snapshot) => {
      const data = snapshot.val() || {};
      // Use local date instead of UTC
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      setStats({
        activeStreaks: data.activeStreaks || 0,
        totalCheckins: data.totalCheckins || 0,
        todayCheckins: data.todayCheckins?.[today] || 0
      });
      setLoading(false);
    }, (error) => {
      console.log('Firebase read error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Rotate to a new micro-moment every 45 seconds
    const interval = setInterval(() => {
      setCurrentMoment(microMoments[Math.floor(Math.random() * microMoments.length)]);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mx-auto"></div>
      </div>
    );
  }

  // Hide counter when numbers are too low (app just starting)
  if (stats.totalCheckins < 10 && stats.todayCheckins === 0) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl">{currentMoment.icon}</span>
          <p className="text-sm text-slate-200 italic">{currentMoment.text}</p>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => num.toLocaleString();

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-lg">🌍</span>
        <span className="text-purple-300 font-medium text-sm">
          <span className="text-white font-bold">{formatNumber(stats.activeStreaks)}</span> active sessions worldwide
        </span>
      </div>
      <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/10">
        <span className="text-2xl">{currentMoment.icon}</span>
        <p className="text-sm text-slate-200 italic">{currentMoment.text}</p>
      </div>
    </div>
  );
}

// Source labels for display
const sourceLabels = {
  work: '💼 Work', relationship: '💕 Loved ones', health: '🏃 Health',
  peace: '😌 Peace', nature: '🌿 Nature', achievement: '🎯 Achievement',
  fun: '🎉 Fun', rest: '😴 Rest', anticipation: '✨ Looking forward',
  gratitude: '🙏 Gratitude', coffee: '☕ Morning ritual', food: '🍽️ Food',
  progress: '📈 Progress', accomplishment: '✅ Accomplishment',
  growth: '📚 Growth', comfort: '🛏️ Comfort', 'spark-joy': '✨ Spark of Joy',
  tomorrow: '✨ Tomorrow', 'letting-go': '🍃 Letting go'
};

// Global milestones for The World tab
const globalMilestones = [
  { threshold: 100, icon: '🌱', label: '100 smiles' },
  { threshold: 500, icon: '🌿', label: '500 smiles' },
  { threshold: 1000, icon: '🌳', label: '1K smiles' },
  { threshold: 5000, icon: '🌲', label: '5K smiles' },
  { threshold: 10000, icon: '🏔️', label: '10K smiles' },
  { threshold: 50000, icon: '🌍', label: '50K smiles' },
  { threshold: 100000, icon: '✨', label: '100K smiles' },
  { threshold: 1000000, icon: '🌟', label: '1M smiles' },
];

// Heartfelt messages for Share A Smile
const heartfeltMessages = [
  "I thought of you and it brought a smile to my face.",
  "You make the world a brighter place.",
  "Your kindness is a gift to everyone around you.",
  "Thank you for being exactly who you are.",
  "The world is better because you're in it.",
  "You're one of my favorite people.",
  "Your smile is contagious, and I'm grateful for it.",
  "You have a beautiful heart.",
  "Thinking of you and sending good vibes your way.",
  "You matter more than you know.",
  "Your presence makes ordinary moments special.",
  "I'm so lucky to know you.",
  "You bring out the best in people.",
  "You deserve all the happiness in the world.",
  "Just wanted you to know you're appreciated.",
  "Your energy is a blessing.",
  "You make difficult days easier.",
  "The world needs more people like you.",
  "You're a ray of sunshine on cloudy days.",
  "Thank you for being a light in this world.",
  "You are awesome!"
];

// Share A Smile Card Modal - generates shareable heartfelt message card
function ShareSmileCard({ isOpen, onClose, addPoints }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(() =>
    heartfeltMessages[Math.floor(Math.random() * heartfeltMessages.length)]
  );

  const handleShare = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        let shareSuccessful = false;
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'smile.png', { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], 'smile.png', { type: 'image/png' })],
              title: 'A Smile For You',
              text: message
            });
            shareSuccessful = true;
          } catch (e) {
            // User cancelled or error
          }
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'smile.png';
          a.click();
          URL.revokeObjectURL(url);
          shareSuccessful = true;
        }

        if (shareSuccessful && addPoints) {
          addPoints(POINTS.SHARE_SMILE);
        }
        setGenerating(false);
      }, 'image/png');
    } catch {
      setGenerating(false);
      alert('Could not generate image');
    }
  };

  const refreshMessage = () => {
    setMessage(heartfeltMessages[Math.floor(Math.random() * heartfeltMessages.length)]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-sm w-full p-6 border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">💛 Share A Smile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* The Card to be captured */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-amber-400 via-orange-400 to-pink-400 rounded-2xl p-8 mb-4 aspect-square flex items-center justify-center"
        >
          <div className="text-center text-white">
            <p className="text-6xl mb-6">💛</p>
            <p className="text-lg font-medium leading-relaxed italic px-2">
              "{message}"
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <button
            onClick={refreshMessage}
            className="flex-1 py-3 rounded-xl border border-purple-500/30 text-purple-300 font-semibold hover:bg-purple-500/10 transition"
          >
            🔄 New Message
          </button>
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50"
          >
            {generating ? '⏳ Creating...' : '📤 Share'}
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center">Spread kindness, one smile at a time</p>
      </div>
    </div>
  );
}

// Generic Share Image Card for quotes, exercises, and gratitude
function ShareImageCard({ isOpen, onClose, type, data }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        const filename = `stillhappy-${type}.png`;
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], filename, { type: 'image/png' })],
              title: type === 'quote' ? 'Wisdom to Share' : type === 'spark' ? 'Spark Of Joy' : type === 'exercise' ? 'Mental Dojo Practice' : 'Gratitude',
              text: `Smile, and the whole world smileswithyou.com. ✨`
            });
          } catch (e) {
            // User cancelled or error
          }
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
        }
        setGenerating(false);
      }, 'image/png');
    } catch {
      setGenerating(false);
      alert('Could not generate image');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-sm w-full p-6 border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">📸 Share</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Quote Card */}
        {type === 'quote' && data && (
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 rounded-2xl p-6 mb-4"
          >
            <div className="text-center text-white">
              <p className="text-4xl mb-4">🌱</p>
              <p className="text-lg italic mb-4 leading-relaxed">"{data.text}"</p>
              <p className="text-sm font-semibold mb-1">— {data.author}</p>
              <p className="text-xs opacity-80 mb-4">{data.tradition}</p>
              <p className="text-xs font-bold opacity-90">Smile, and the whole world smileswithyou.com.</p>
            </div>
          </div>
        )}

        {/* Full Exercise Card */}
        {type === 'exercise' && data && (
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-200 rounded-2xl p-6 mb-4"
          >
            <div className="text-indigo-900">
              <div className="text-center mb-4">
                <p className="text-3xl mb-2">🥋</p>
                <p className="text-xl font-bold mb-1">{data.title}</p>
                <p className="text-sm opacity-80 mb-2">{data.subtitle}</p>
              </div>

              {/* All steps */}
              <div className="bg-white/10 rounded-xl p-4 mb-3">
                <ol className="text-left space-y-2">
                  {data.steps.map((step, index) => (
                    <li key={index} className="text-sm leading-relaxed">
                      <span className="font-semibold">{index + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </div>

              <p className="text-xs text-center opacity-90">
                <span className="font-medium">Smile, and the whole world </span>
                <span className="font-bold">smileswithyou.com</span>
              </p>
            </div>
          </div>
        )}

        {/* Spark Of Joy Card (After Mental Dojo practice) */}
        {type === 'spark' && data && (
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-blue-200 via-purple-200 to-indigo-200 rounded-2xl p-8 mb-4 relative overflow-hidden"
          >
            {/* Decorative sparks - gold to stand out on cool tones */}
            <div className="absolute top-2 left-2 text-2xl opacity-80" style={{filter: 'drop-shadow(0 0 4px #fbbf24)'}}>✨</div>
            <div className="absolute top-4 right-4 text-xl opacity-90" style={{filter: 'drop-shadow(0 0 4px #fbbf24)'}}>✨</div>
            <div className="absolute bottom-3 left-4 text-xl opacity-80" style={{filter: 'drop-shadow(0 0 4px #fbbf24)'}}>✨</div>
            <div className="absolute bottom-2 right-3 text-2xl opacity-90" style={{filter: 'drop-shadow(0 0 4px #fbbf24)'}}>✨</div>
            <div className="absolute top-1/2 left-2 text-lg opacity-70" style={{filter: 'drop-shadow(0 0 4px #fbbf24)'}}>✨</div>
            <div className="absolute top-1/3 right-2 text-lg opacity-70" style={{filter: 'drop-shadow(0 0 4px #fbbf24)'}}>✨</div>

            <div className="text-center text-indigo-900 relative z-10">
              <p className="text-4xl mb-3">🥋</p>
              <p className="text-xl font-bold mb-1">{data.title}</p>
              <p className="text-sm opacity-80 mb-4">{data.subtitle}</p>

              {/* Practice instruction */}
              <div className="bg-white/10 rounded-xl p-5 mb-3">
                <p className="font-semibold mb-2">Practice:</p>
                <p className="text-base leading-relaxed">
                  {data.practiceInstruction}
                </p>
              </div>

              {/* Seed thought */}
              <div className="bg-white/20 rounded-xl p-4 mb-4">
                <p className="text-sm italic leading-relaxed">
                  "{data.seedThought}"
                </p>
              </div>

              <p className="text-sm opacity-90">
                <span className="font-medium">Smile, and the whole world </span>
                <span className="font-bold">smileswithyou.com</span>
              </p>
            </div>
          </div>
        )}

        {/* World Stats Card */}
        {type === 'world' && data && (
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 mb-4"
          >
            <div className="text-center text-white">
              <p className="text-5xl mb-3">🌍</p>
              <p className="text-2xl font-bold mb-1">The World is Smiling</p>
              <p className="text-4xl font-black mb-2">{data.totalSmiles.toLocaleString()}</p>
              <p className="text-sm opacity-90 mb-4">smiles shared globally</p>

              {data.topSources && data.topSources.length > 0 && (
                <div className="bg-white/20 rounded-xl p-3 mb-3">
                  <p className="text-xs uppercase tracking-wider opacity-80 mb-2">Top happiness sources</p>
                  <div className="flex flex-col gap-1 text-sm">
                    {data.topSources.map(([source, count], index) => {
                      const labels = {
                        work: '💼 Work', relationship: '💕 Loved ones', health: '🏃 Health',
                        peace: '😌 Peace', nature: '🌿 Nature', achievement: '🎯 Achievement',
                        fun: '🎉 Fun', rest: '😴 Rest'
                      };
                      return (
                        <div key={source} className="flex items-center justify-between">
                          <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {labels[source] || source}</span>
                          <span className="font-semibold">{count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs italic opacity-90 mb-3">
                "Smile and the whole world smiles with you"
              </p>

              <div className="bg-white/20 rounded-lg px-3 py-2 inline-block">
                <p className="text-xs font-semibold">🏆 {data.earnedMilestones}/{data.totalMilestones} milestones unlocked</p>
              </div>

              <p className="text-xs font-bold opacity-90 mt-4">Smile, and the whole world smileswithyou.com.</p>
            </div>
          </div>
        )}

        <button
          onClick={handleShare}
          disabled={generating}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50"
        >
          {generating ? '⏳ Creating...' : '📤 Share Image'}
        </button>
        <p className="text-xs text-slate-400 text-center mt-2">Creates a beautiful image to share</p>
      </div>
    </div>
  );
}

// Quote Browser/Carousel Component
function QuoteBrowser({ isOpen, onClose, addPoints, onBoost }) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * wisdomQuotes.length));
  const [showShareModal, setShowShareModal] = useState(false);

  const currentQuote = wisdomQuotes[currentIndex];

  const randomQuote = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * wisdomQuotes.length);
    } while (newIndex === currentIndex && wisdomQuotes.length > 1);
    setCurrentIndex(newIndex);
  };

  // Randomize on open for variety
  useEffect(() => {
    if (isOpen) {
      randomQuote();
    }
  }, [isOpen]);

  const handleBoost = () => {
    addPoints(POINTS.QUOTE_BOOST);
    onBoost?.();
    randomQuote();
  };

  const handleSkip = () => {
    randomQuote();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-purple-400/20" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">🌱 Seeds Of Thought</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-4 text-center">
          <div className="border-l-4 border-purple-400 bg-white/5 p-5 rounded-r-xl mb-6 min-h-[200px] flex flex-col justify-center">
            <p className="text-lg italic mb-3 leading-relaxed">"{currentQuote.text}"</p>
            <p className="text-purple-400 font-medium">— {currentQuote.author}</p>
            <p className="text-slate-400 text-sm">{currentQuote.tradition}</p>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={handleBoost}
              className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-lg transition hover:scale-105"
            >
              💫 +{POINTS.QUOTE_BOOST} Boost & Next
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition"
            >
              ✕ Close
            </button>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="w-full py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm hover:bg-purple-500/30 transition"
          >
            📤 Share
          </button>
        </div>
      </div>

      <ShareImageCard
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="quote"
        data={currentQuote}
      />
    </div>
  );
}

// Mindfulness Visual Meditation Component - 30 second Tratak (circle gazing)
// Mental Dojo - 30-second practice space
function MentalDojo({ exercise, isOpen, onComplete, onClose, addPoints, onShare }) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [isComplete, setIsComplete] = useState(false);
  const [showSparks, setShowSparks] = useState(false);

  // Calculate progress percentage for glow effect (0% to 100%)
  const progress = ((30 - timeLeft) / 30) * 100;
  const glowIntensity = progress / 100; // 0 to 1

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(30);
      setIsComplete(false);
      setShowSparks(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsComplete(true);
          setShowSparks(true);
          // Hide sparks after 2 seconds
          setTimeout(() => setShowSparks(false), 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4 z-50">
      <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        {!isComplete ? (
          // During practice - 30 seconds with growing glow and progress bar
          <div className="text-center animate-in fade-in duration-1000 relative">
            <div className="text-6xl mb-8">🥋</div>

            {/* Practice instruction - the kaizen one-liner with intensifying glow */}
            <div className="relative mb-12">
              {/* Outer glow that intensifies */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-orange-500 via-yellow-500 to-amber-500 blur-3xl rounded-2xl transition-opacity duration-1000"
                style={{ opacity: 0.1 + (glowIntensity * 0.4) }}
              ></div>
              {/* Inner card with border that gets brighter */}
              <div
                className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-10 transition-all duration-1000"
                style={{
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: `rgba(251, 146, 60, ${0.3 + (glowIntensity * 0.5)})`
                }}
              >
                <p className="text-2xl leading-relaxed text-orange-100">
                  {exercise.practiceInstruction}
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-4">Once you find the spark</p>

            {/* Progress bar at bottom */}
            <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-400 transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <button
              onClick={() => {
                setIsComplete(true);
                setShowSparks(true);
                setTimeout(() => setShowSparks(false), 2000);
              }}
              className="px-8 py-3 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-slate-900 rounded-xl font-bold transition hover:scale-105"
            >
              Light The Flame
            </button>
          </div>
        ) : (
          // After 30 seconds - completion with seed thought and sparks
          <div className="text-center animate-in fade-in duration-1000 relative">
            {/* Sparks animation */}
            {showSparks && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-ping"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDuration: `${0.5 + Math.random() * 1}s`,
                      animationDelay: `${Math.random() * 0.3}s`,
                    }}
                  >
                    <div className={`text-${['orange', 'yellow', 'amber'][Math.floor(Math.random() * 3)]}-400`}>
                      ✨
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-3xl font-bold mb-8 text-orange-300">You've planted a seed of joy, it will spark within</h3>

            {/* The seed thought */}
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-yellow-500/10 to-amber-500/10 blur-2xl rounded-2xl"></div>
              <div className="relative bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-400/30 rounded-2xl p-10">
                <p className="text-3xl font-medium leading-relaxed italic text-orange-100">
                  "{exercise.seedThought}"
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => {
                  onShare();
                }}
                className="flex-1 min-w-[200px] py-4 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-slate-900 rounded-xl font-bold text-lg transition hover:scale-105"
              >
                ✨ Share This Spark Of Joy
              </button>
              <button
                onClick={() => {
                  onComplete();
                }}
                className="flex-1 min-w-[200px] py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-slate-900 rounded-xl font-bold text-lg transition hover:scale-105"
              >
                💫 +{POINTS.EXERCISE_BOOST} Next Spark
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition"
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Exercise Browser/Carousel Component
function ExerciseBrowser({ isOpen, onClose, addPoints, onBoost, playSound }) {
  const allExercises = exercises;
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * allExercises.length));
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDojoShareModal, setShowDojoShareModal] = useState(false);
  const [showMentalDojo, setShowMentalDojo] = useState(false);

  const currentExercise = allExercises[currentIndex];

  const randomExercise = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * allExercises.length);
    } while (newIndex === currentIndex && allExercises.length > 1);
    setCurrentIndex(newIndex);
  };

  // Randomize on open for variety
  useEffect(() => {
    if (isOpen) {
      randomExercise();
    }
  }, [isOpen]);

  const handleBoost = () => {
    addPoints(POINTS.EXERCISE_BOOST);
    onBoost?.();
    randomExercise();
  };

  const handleDojoComplete = () => {
    addPoints(POINTS.EXERCISE_BOOST);
    onBoost?.();
    setShowMentalDojo(false);
    randomExercise();
  };

  const handleDojoShare = () => {
    addPoints(POINTS.EXERCISE_BOOST);
    setShowMentalDojo(false);
    setShowDojoShareModal(true);
  };

  const handleSkip = () => {
    randomExercise();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-green-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">✨ Sparks Of Joy</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-4">
          <div className={`${currentExercise.isNightOnly ? 'bg-indigo-400/10 border-indigo-400/30' : 'bg-green-400/10 border-green-400/30'} border rounded-xl p-4 mb-6`}>
            <h3 className={`${currentExercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'} font-semibold text-lg mb-1`}>
              {currentExercise.isNightOnly ? '🌙' : '🧘'} {currentExercise.title}
            </h3>
            <p className="text-slate-400 text-sm mb-3">{currentExercise.subtitle}</p>
            {currentExercise.description && (
              <p className="text-slate-300 text-sm mb-3 italic">{currentExercise.description}</p>
            )}
            {currentExercise.pattern && <BreathingGuide pattern={currentExercise.pattern} playSound={playSound} />}
            <ul className="space-y-1.5 text-sm mt-3">
              {currentExercise.steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className={currentExercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'}>{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Mental Dojo button for sparks of joy exercises */}
          {currentExercise.practiceInstruction ? (
            <>
              <button
                onClick={() => setShowMentalDojo(true)}
                className="w-full py-5 mb-3 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-slate-900 rounded-xl font-bold text-lg transition hover:scale-105"
              >
                🥋 Enter Your Mental Dojo
              </button>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-slate-900 rounded-xl font-semibold transition"
                >
                  🔀 Next Exercise
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm"
                >
                  ✕ Close
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleBoost}
                className="flex-1 py-4 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-slate-900 rounded-xl font-bold text-lg transition hover:scale-105"
              >
                💫 +{POINTS.EXERCISE_BOOST} Boost & Next
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition"
              >
                ✕ Close
              </button>
            </div>
          )}

          <button
            onClick={() => setShowShareModal(true)}
            className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/30 transition"
          >
            📤 Share
          </button>
        </div>
      </div>

      <ShareImageCard
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="exercise"
        data={currentExercise}
      />

      {/* Mental Dojo Share Modal - Spark Of Joy Card */}
      <ShareImageCard
        isOpen={showDojoShareModal}
        onClose={() => setShowDojoShareModal(false)}
        type="spark"
        data={currentExercise}
      />

      {/* Mental Dojo Component */}
      {currentExercise.practiceInstruction && (
        <MentalDojo
          exercise={currentExercise}
          isOpen={showMentalDojo}
          onComplete={handleDojoComplete}
          onClose={() => setShowMentalDojo(false)}
          addPoints={addPoints}
          onShare={handleDojoShare}
        />
      )}
    </div>
  );
}

// CBT Exercise Browser/Carousel Component
function CBTBrowser({ isOpen, onClose, addPoints, onBoost, playSound }) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * cbtExercises.length));
  const [showShareModal, setShowShareModal] = useState(false);

  const currentExercise = cbtExercises[currentIndex];

  const randomExercise = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * cbtExercises.length);
    } while (newIndex === currentIndex && cbtExercises.length > 1);
    setCurrentIndex(newIndex);
  };

  // Randomize on open for variety
  useEffect(() => {
    if (isOpen) {
      randomExercise();
    }
  }, [isOpen]);

  const handleBoost = () => {
    addPoints(POINTS.CBT_BOOST);
    onBoost?.();
    randomExercise();
  };

  const handleSkip = () => {
    randomExercise();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-blue-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">🧠 Tools Of Thought</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-4">
          <div className="bg-blue-400/10 border-blue-400/30 border rounded-xl p-4 mb-6">
            <h3 className="text-blue-400 font-semibold text-lg mb-1">
              🧠 {currentExercise.title}
            </h3>
            <p className="text-slate-400 text-sm mb-3">{currentExercise.subtitle}</p>
            {currentExercise.description && (
              <p className="text-slate-300 text-sm mb-3 italic">{currentExercise.description}</p>
            )}
            {currentExercise.pattern && <BreathingGuide pattern={currentExercise.pattern} playSound={playSound} />}
            <ul className="space-y-1.5 text-sm mt-3">
              {currentExercise.steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-400">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              onClick={handleBoost}
              className="flex-1 py-4 bg-gradient-to-r from-blue-400 to-teal-500 hover:from-blue-500 hover:to-teal-600 text-slate-900 rounded-xl font-bold text-lg transition hover:scale-105"
            >
              💫 +{POINTS.CBT_BOOST} Boost & Next
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition"
            >
              ✕ Close
            </button>
          </div>

          <button
            onClick={() => setShowShareModal(true)}
            className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/30 transition"
          >
            📤 Share
          </button>
        </div>
      </div>

      <ShareImageCard
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="exercise"
        data={currentExercise}
      />
    </div>
  );
}

// Breathwork Browser Component - 1-minute breathing patterns
function BreathworkBrowser({ isOpen, onClose, addPoints, onBoost, playSound }) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * breathworkPatterns.length));
  const [isActive, setIsActive] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const currentPattern = breathworkPatterns[currentIndex];
  const targetCycles = Math.floor(60 / currentPattern.duration); // cycles in 1 minute

  const randomPattern = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * breathworkPatterns.length);
    } while (newIndex === currentIndex && breathworkPatterns.length > 1);
    setCurrentIndex(newIndex);
    setIsActive(false);
    setCycles(0);
    setShowCompletion(false);
  };

  // Randomize on open for variety
  useEffect(() => {
    if (isOpen) {
      randomPattern();
    }
  }, [isOpen]);

  const handleStart = () => {
    setIsActive(true);
    setCycles(0);
    setShowCompletion(false);
  };

  const handleBoost = () => {
    addPoints(POINTS.BREATHWORK_BOOST);
    onBoost?.();
    randomPattern();
  };

  const handleSkip = () => {
    randomPattern();
  };

  useEffect(() => {
    if (!isActive) return;

    const cycleTimer = setInterval(() => {
      setCycles(prev => {
        const newCycles = prev + 1;
        if (newCycles >= targetCycles) {
          setIsActive(false);
          setShowCompletion(true);
          return newCycles;
        }
        return newCycles;
      });
    }, currentPattern.duration * 1000);

    return () => clearInterval(cycleTimer);
  }, [isActive, currentPattern.duration, targetCycles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-teal-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">🌬️ Breath Of Fresh Air</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-4">
          {!isActive && !showCompletion && (
            <>
              <div className="bg-teal-400/10 border-teal-400/30 border rounded-xl p-5 mb-6">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{currentPattern.emoji}</div>
                  <h3 className="text-teal-400 font-semibold text-xl mb-1">
                    {currentPattern.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">{currentPattern.subtitle}</p>
                  <p className="text-slate-300 text-sm italic">{currentPattern.description}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <p className="text-xs text-slate-400 mb-2">Pattern:</p>
                  <div className="flex gap-2 text-sm justify-center flex-wrap">
                    <span className="text-teal-400">Inhale: {currentPattern.pattern.inhale}s</span>
                    {currentPattern.pattern.hold1 > 0 && <span className="text-purple-400">Hold: {currentPattern.pattern.hold1}s</span>}
                    <span className="text-pink-400">Exhale: {currentPattern.pattern.exhale}s</span>
                    {currentPattern.pattern.hold2 > 0 && <span className="text-purple-400">Hold: {currentPattern.pattern.hold2}s</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400 mb-1">Benefits:</p>
                  {currentPattern.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-teal-400">✓</span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl font-bold text-lg transition hover:scale-105 mb-3"
              >
                🧘 Start 1-Minute Zen
              </button>

              <button
                onClick={randomPattern}
                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition"
              >
                → Try Different Pattern
              </button>
            </>
          )}

          {isActive && (
            <div className="text-center py-10">
              <div className="mb-6">
                <BreathingGuide pattern={currentPattern.pattern} playSound={playSound} />
              </div>
              <div className="text-slate-400 text-sm">
                Cycle {cycles + 1} of {targetCycles}
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Keep breathing... {Math.max(0, 60 - cycles * currentPattern.duration)}s remaining
              </div>
            </div>
          )}

          {showCompletion && (
            <>
              <div className="text-center py-8 mb-6">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold mb-2">Beautiful work!</h3>
                <p className="text-slate-400">You completed {cycles} breathing cycles</p>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleBoost}
                  className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl font-bold text-lg transition hover:scale-105"
                >
                  💫 +{POINTS.BREATHWORK_BOOST} Boost & Next
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition"
                >
                  ✕ Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Micro-Moment Component - Gentle rotating mindfulness prompts
function MicroMoment() {
  const [currentMoment, setCurrentMoment] = useState(() =>
    microMoments[Math.floor(Math.random() * microMoments.length)]
  );

  useEffect(() => {
    // Rotate to a new micro-moment every 45 seconds
    const interval = setInterval(() => {
      setCurrentMoment(microMoments[Math.floor(Math.random() * microMoments.length)]);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur rounded-2xl p-4 mb-4 border border-purple-500/20 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{currentMoment.icon}</span>
        <p className="text-sm text-slate-200 italic">{currentMoment.text}</p>
      </div>
    </div>
  );
}

// World Quote Carousel - Shows all quotes sorted by favorites
function WorldQuoteCarousel({ topQuotes }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (topQuotes.length === 0) return null;

  const currentItem = topQuotes[currentIndex];

  const nextQuote = () => {
    setCurrentIndex((currentIndex + 1) % topQuotes.length);
  };

  const prevQuote = () => {
    setCurrentIndex((currentIndex - 1 + topQuotes.length) % topQuotes.length);
  };

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-4 border border-white/10">
      <h3 className="font-semibold mb-4 flex items-center gap-2">💝 World's Favorite Wisdom</h3>
      <p className="text-center text-xs text-slate-400 mb-3">
        {currentIndex + 1} of {topQuotes.length}
      </p>
      <div className="border-l-4 border-purple-400/50 bg-white/5 p-4 rounded-r-xl mb-4">
        <p className="text-sm italic leading-snug mb-2">"{currentItem.quote.text}"</p>
        <p className="text-xs text-purple-400 mb-2">— {currentItem.quote.author}</p>
        <p className="text-xs text-slate-500">{currentItem.quote.tradition}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={prevQuote}
          disabled={topQuotes.length === 1}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={nextQuote}
          disabled={topQuotes.length === 1}
          className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// World CBT Carousel - Shows CBT exercises used to get back on track
function WorldCBTCarousel({ topCBTExercises }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (topCBTExercises.length === 0) return null;

  const currentItem = topCBTExercises[currentIndex];

  const nextExercise = () => {
    setCurrentIndex((currentIndex + 1) % topCBTExercises.length);
  };

  const prevExercise = () => {
    setCurrentIndex((currentIndex - 1 + topCBTExercises.length) % topCBTExercises.length);
  };

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-4 border border-white/10">
      <h3 className="font-semibold mb-4 flex items-center gap-2">💙 Getting Back on Track</h3>
      <p className="text-center text-xs text-slate-400 mb-3">
        {currentIndex + 1} of {topCBTExercises.length}
      </p>
      <div className="border-l-4 border-blue-400/50 bg-white/5 p-4 rounded-r-xl mb-4 max-h-[400px] overflow-y-auto">
        <p className="text-sm font-semibold text-blue-400 mb-1">💙 {currentItem.exercise.title}</p>
        <p className="text-xs text-slate-400 mb-3">{currentItem.exercise.subtitle}</p>
        {currentItem.exercise.description && (
          <p className="text-xs text-slate-300 mb-2 italic">{currentItem.exercise.description}</p>
        )}
        <ul className="space-y-1.5 text-xs mb-3">
          {currentItem.exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-blue-400 flex-shrink-0">{i + 1}.</span>
              <span className="text-slate-300">{step}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={prevExercise}
          disabled={topCBTExercises.length === 1}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={nextExercise}
          disabled={topCBTExercises.length === 1}
          className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// World Exercise Carousel - Shows all exercises sorted by favorites
function WorldExerciseCarousel({ topExercises }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (topExercises.length === 0) return null;

  const currentItem = topExercises[currentIndex];

  const nextExercise = () => {
    setCurrentIndex((currentIndex + 1) % topExercises.length);
  };

  const prevExercise = () => {
    setCurrentIndex((currentIndex - 1 + topExercises.length) % topExercises.length);
  };

  return (
    <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-4 border border-white/10">
      <h3 className="font-semibold mb-4 flex items-center gap-2">🌟 World's Favorite Practices</h3>
      <p className="text-center text-xs text-slate-400 mb-3">
        {currentIndex + 1} of {topExercises.length}
      </p>
      <div className="border-l-4 border-green-400/50 bg-white/5 p-4 rounded-r-xl mb-4 max-h-[400px] overflow-y-auto">
        <p className="text-sm font-semibold text-green-400 mb-1">{currentItem.exercise.title}</p>
        <p className="text-xs text-slate-400 mb-3">{currentItem.exercise.subtitle}</p>
        {currentItem.exercise.description && (
          <p className="text-xs text-slate-300 mb-2 italic">{currentItem.exercise.description}</p>
        )}
        <ul className="space-y-1.5 text-xs mb-3">
          {currentItem.exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-green-400 flex-shrink-0">{i + 1}.</span>
              <span className="text-slate-300">{step}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={prevExercise}
          disabled={topExercises.length === 1}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={nextExercise}
          disabled={topExercises.length === 1}
          className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 rounded-xl font-semibold transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// The World Tab Component - Ripples of Joy
function TheWorldTab() {
  const [sparks, setSparks] = useState([]);
  const [sparkCount, setSparkCount] = useState(0);
  const [showGiveMessage, setShowGiveMessage] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef(null);
  const continuousSparkInterval = useRef(null);

  // Thank you in different languages
  const thankYouMessages = [
    'Thank you', 'Merci', 'Gracias', 'Danke', 'Grazie',
    'Obrigado', 'Спасибо', 'ありがとう', '谢谢', 'شكرا',
    'Teşekkürler', 'Tack', 'Dziękuję', '감사합니다', 'Kiitos',
    'Dhanyavaad', 'Toda', 'Terima kasih', 'Cảm ơn', 'Ευχαριστώ'
  ];

  const addSpark = (x, y, isUserSpark = false) => {
    const newSpark = {
      id: Date.now() + Math.random(),
      left: x !== undefined ? x : Math.random() * 80 + 10,
      top: y !== undefined ? y : Math.random() * 80 + 10,
      delay: Math.random() * 0.5,
      message: thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)],
      isUserSpark
    };

    setSparks(prev => [...prev, newSpark]);
    setSparkCount(prev => prev + 1);

    setTimeout(() => {
      setSparks(prev => prev.filter(s => s.id !== newSpark.id));
    }, 3000);
  };

  // Detect two-finger touch (ring + middle finger)
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 2 && imageRef.current?.contains(e.target)) {
        e.preventDefault();

        // Check if fingers are close together (ring + middle finger)
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        // If fingers are reasonably close (within 100px), consider it ring+middle
        if (distance < 100) {
          // Haptic feedback - create ripple effect
          if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50, 30, 50]); // Ripple pattern
          }

          setIsTouching(true);

          // Calculate center position
          const rect = imageRef.current.getBoundingClientRect();
          const centerX = ((touch1.clientX + touch2.clientX) / 2 - rect.left) / rect.width * 100;
          const centerY = ((touch1.clientY + touch2.clientY) / 2 - rect.top) / rect.height * 100;

          // Store touch position for ripple circles
          setTouchPosition({ x: centerX, y: centerY });

          // Add initial spark
          addSpark(centerX, centerY, true);
          setShowGiveMessage(true);

          // Start continuous sparks while holding
          continuousSparkInterval.current = setInterval(() => {
            const offsetX = centerX + (Math.random() - 0.5) * 20;
            const offsetY = centerY + (Math.random() - 0.5) * 20;
            addSpark(offsetX, offsetY, true);
          }, 300);
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        setIsTouching(false);
        setShowGiveMessage(false);
        if (continuousSparkInterval.current) {
          clearInterval(continuousSparkInterval.current);
          continuousSparkInterval.current = null;
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      if (continuousSparkInterval.current) {
        clearInterval(continuousSparkInterval.current);
      }
    };
  }, []);

  // Generate sparks at random intervals
  useEffect(() => {
    const interval = setInterval(() => {
      addSpark();
    }, 1000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl">
        <h2 className="text-2xl font-bold mb-3">🌊 Ripples of Joy</h2>
        <p className="text-slate-300 text-base leading-relaxed mb-2">
          Give and you shall receive.
        </p>
        <p className="text-slate-400 text-sm mb-3">
          Smile, and the whole world smiles with you.
        </p>
        <p className="text-amber-300 text-lg leading-relaxed">
          Smile because someone in the world has sparked joy!
        </p>
      </div>

      {/* Earth Image with Sparks */}
      <div className="relative mb-8 max-w-lg w-full">
        <div
          ref={imageRef}
          className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-black"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg"
            alt="Blue Marble (Apollo 17)"
            className="w-full h-auto"
            style={{ minHeight: '300px', maxHeight: '500px', objectFit: 'contain' }}
          />

          {/* Concentric Ripple Circles - shown when touching */}
          {isTouching && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute animate-ripple-1"
                style={{
                  left: `${touchPosition.x}%`,
                  top: `${touchPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  border: '2px solid rgba(251, 191, 36, 0.6)',
                  borderRadius: '50%'
                }}
              />
              <div
                className="absolute animate-ripple-2"
                style={{
                  left: `${touchPosition.x}%`,
                  top: `${touchPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  border: '2px solid rgba(251, 191, 36, 0.5)',
                  borderRadius: '50%'
                }}
              />
              <div
                className="absolute animate-ripple-3"
                style={{
                  left: `${touchPosition.x}%`,
                  top: `${touchPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '40px',
                  height: '40px',
                  border: '2px solid rgba(251, 191, 36, 0.4)',
                  borderRadius: '50%'
                }}
              />
            </div>
          )}

          {/* Sparks overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {sparks.map(spark => (
              <div
                key={spark.id}
                className={`absolute animate-spark ${spark.isUserSpark ? 'text-yellow-300' : 'text-blue-300'}`}
                style={{
                  left: `${spark.left}%`,
                  top: `${spark.top}%`,
                  animationDelay: `${spark.delay}s`
                }}
              >
                <div className="text-xs font-semibold whitespace-nowrap">
                  ✨ {spark.message}
                </div>
              </div>
            ))}
          </div>

          {/* Give Message Overlay */}
          {showGiveMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
              <div className="text-center">
                <div className="text-6xl mb-3 animate-pulse">🌊</div>
                <p className="text-yellow-300 text-xl font-semibold">Creating ripples of joy...</p>
                <p className="text-slate-300 text-sm mt-2">Hold to keep the ripples flowing</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-slate-300 text-sm mb-2">
            🤞 Touch Earth with your ring & middle finger together
          </p>
          <p className="text-slate-400 text-xs mb-1">
            Hold to create continuous ripples of joy
          </p>
          <p className="text-slate-400 text-xs">
            You've witnessed <span className="text-yellow-400 font-semibold">{sparkCount}</span> sparks around the world
          </p>
        </div>
      </div>

      {/* Carl Sagan Quote */}
      <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 max-w-2xl">
        <p className="text-slate-300 text-sm leading-relaxed italic mb-3">
          "Look again at that dot. That's here. That's home. That's us. On it everyone you love, everyone you know, everyone you ever heard of, every human being who ever was, lived out their lives...
          on a mote of dust suspended in a sunbeam."
        </p>
        <p className="text-slate-400 text-xs text-right">— Carl Sagan</p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spark {
          0% {
            opacity: 0;
            transform: scale(0) translateY(0);
          }
          30% {
            opacity: 1;
            transform: scale(1) translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(-50px);
          }
        }
        .animate-spark {
          animation: spark 3s ease-out forwards;
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-in;
        }
        @keyframes ripple {
          0% {
            width: 40px;
            height: 40px;
            opacity: 1;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
        .animate-ripple-1 {
          animation: ripple 2s ease-out infinite;
        }
        .animate-ripple-2 {
          animation: ripple 2s ease-out infinite;
          animation-delay: 0.4s;
        }
        .animate-ripple-3 {
          animation: ripple 2s ease-out infinite;
          animation-delay: 0.8s;
        }
      `}</style>
    </div>
  );
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getDayKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Breathing Guide Component - Heart Coherence (5 in, 5 out)
function BreathingGuide({ pattern, playSound }) {
  const [phase, setPhase] = useState('inhale');
  const [count, setCount] = useState(pattern.inhale);
  const [resetKey, setResetKey] = useState(0);
  const playSoundRef = useRef(playSound);
  const patternRef = useRef(pattern);

  // Update refs when props change (but don't re-run effects)
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  // When pattern changes, reset the breathing cycle
  useEffect(() => {
    patternRef.current = pattern;
    setPhase('inhale');
    setCount(pattern.inhale);
    setResetKey(prev => prev + 1); // Force interval recreation
    if (playSoundRef.current) playSoundRef.current('breathInhale');
  }, [pattern]);

  // Breathing cycle with pattern support - starts immediately
  useEffect(() => {
    let currentPhase = 'inhale';
    let currentCount = patternRef.current.inhale;

    const interval = setInterval(() => {
      currentCount--;

      if (currentCount <= 0) {
        // Access current pattern directly from ref to handle pattern changes
        const p = patternRef.current;

        // Determine next phase based on pattern
        if (currentPhase === 'inhale') {
          if (p.hold1 && p.hold1 > 0) {
            currentPhase = 'hold1';
            currentCount = p.hold1;
          } else {
            currentPhase = 'exhale';
            currentCount = p.exhale;
            if (playSoundRef.current) playSoundRef.current('breathExhale');
          }
        } else if (currentPhase === 'hold1') {
          currentPhase = 'exhale';
          currentCount = p.exhale;
          if (playSoundRef.current) playSoundRef.current('breathExhale');
        } else if (currentPhase === 'exhale') {
          if (p.hold2 && p.hold2 > 0) {
            currentPhase = 'hold2';
            currentCount = p.hold2;
          } else {
            currentPhase = 'inhale';
            currentCount = p.inhale;
            if (playSoundRef.current) playSoundRef.current('breathInhale');
          }
        } else if (currentPhase === 'hold2') {
          currentPhase = 'inhale';
          currentCount = p.inhale;
          if (playSoundRef.current) playSoundRef.current('breathInhale');
        }

        setPhase(currentPhase);
      }

      setCount(currentCount);
    }, 1000);

    return () => clearInterval(interval);
  }, [resetKey]); // Recreate interval when pattern changes

  const labels = {
    inhale: 'Breathe In',
    exhale: 'Breathe Out',
    hold1: 'Hold',
    hold2: 'Hold'
  };
  const colors = {
    inhale: 'bg-green-500/30 scale-110',
    exhale: 'bg-blue-500/30 scale-90',
    hold1: 'bg-yellow-500/30 scale-100',
    hold2: 'bg-purple-500/30 scale-95'
  };

  return (
    <div className={`w-24 h-24 mx-auto rounded-full flex flex-col items-center justify-center transition-all duration-1000 ${colors[phase]}`}>
      <span className="text-xs font-medium">{labels[phase]}</span>
      <span className="text-2xl font-bold">{count}</span>
    </div>
  );
}

// Confirm Dialog Component
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", danger = true }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
      <div className="bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-white/20" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/10 py-3 rounded-xl font-medium">Cancel</button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`flex-1 py-3 rounded-xl font-bold ${danger ? 'bg-red-500 text-white' : 'bg-green-500 text-slate-900'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Power Boost Menu - Inline component shown after happy check-ins
function PowerBoost({ onSkip, onSelectTool }) {
  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur rounded-2xl p-6 mb-4 border border-purple-400/30 animate-fade-in">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-1">Want a Power Boost? 💫</h3>
        <p className="text-slate-400 text-sm">Keep the momentum going with one of these tools</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => onSelectTool('quotes')}
          className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-400/30 rounded-xl p-4 transition hover:scale-105"
        >
          <div className="text-3xl mb-2">🌱</div>
          <div className="font-semibold text-sm">Seeds Of Thought</div>
          <div className="text-xs text-purple-300 mt-1">+10 pts</div>
        </button>

        <button
          onClick={() => onSelectTool('exercises')}
          className="bg-gradient-to-br from-green-500/30 to-teal-500/30 hover:from-green-500/40 hover:to-teal-500/40 border border-green-400/30 rounded-xl p-4 transition hover:scale-105"
        >
          <div className="text-3xl mb-2">✨</div>
          <div className="font-semibold text-sm">Sparks Of Joy</div>
          <div className="text-xs text-green-300 mt-1">+15 pts</div>
        </button>

        <button
          onClick={() => onSelectTool('breathwork')}
          className="bg-gradient-to-br from-teal-500/30 to-cyan-500/30 hover:from-teal-500/40 hover:to-cyan-500/40 border border-teal-400/30 rounded-xl p-4 transition hover:scale-105"
        >
          <div className="text-3xl mb-2">🌬️</div>
          <div className="font-semibold text-sm">Breath Of Fresh Air</div>
          <div className="text-xs text-teal-300 mt-1">+15 pts</div>
        </button>

        <button
          onClick={() => onSelectTool('cbt')}
          className="bg-gradient-to-br from-blue-500/30 to-indigo-500/30 hover:from-blue-500/40 hover:to-indigo-500/40 border border-blue-400/30 rounded-xl p-4 transition hover:scale-105"
        >
          <div className="text-3xl mb-2">💙</div>
          <div className="font-semibold text-sm">CBT Tools</div>
          <div className="text-xs text-blue-300 mt-1">+20 pts</div>
        </button>
      </div>

      <button
        onClick={onSkip}
        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition font-medium"
      >
        Maybe Later →
      </button>
    </div>
  );
}

// Recovery Quest - Inline component for streak recovery
function RecoveryQuest({ brokenStreak, progress, activeQuest, onSelectQuest, onSkip }) {
  const quests = {
    triple: {
      name: "Triple Joy",
      emoji: "🎯",
      description: "3 check-ins today",
      current: progress.checkins,
      total: 3,
      color: "from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-400/30",
    },
    tools: {
      name: "Power Trio",
      emoji: "💫",
      description: "3 power boost tools today",
      current: progress.tools,
      total: 3,
      color: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-400/30",
    },
    bookend: {
      name: "Bookend Ritual",
      emoji: "🌅🌙",
      description: "Morning + Evening check-in",
      current: (progress.morning ? 1 : 0) + (progress.evening ? 1 : 0),
      total: 2,
      color: "from-blue-500/20 to-indigo-500/20",
      border: "border-blue-400/30",
    },
  };

  if (activeQuest) {
    const quest = quests[activeQuest];
    const isComplete = quest.current >= quest.total;

    return (
      <div className={`bg-gradient-to-br ${quest.color} backdrop-blur rounded-2xl p-6 mb-4 border ${quest.border} animate-fade-in`}>
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{quest.emoji}</div>
          <h3 className="text-xl font-bold mb-1">{quest.name}</h3>
          <p className="text-slate-400 text-sm">{quest.description}</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-300">Progress</span>
            <span className="text-lg font-bold">{quest.current}/{quest.total}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(quest.current / quest.total) * 100}%` }}
            />
          </div>
        </div>

        {isComplete ? (
          <div className="text-center">
            <p className="text-green-400 font-bold mb-2">✨ Quest Complete! ✨</p>
            <p className="text-sm text-slate-300">Your {brokenStreak}-day streak has been restored!</p>
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400">
            {activeQuest === 'bookend'
              ? `${!progress.morning ? '🌅 Morning' : ''}${!progress.morning && !progress.evening ? ' & ' : ''}${!progress.evening ? '🌙 Evening' : ''} check-in needed`
              : `${quest.total - quest.current} more to go!`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/20 to-red-500/20 backdrop-blur rounded-2xl p-6 mb-4 border border-amber-400/30 animate-fade-in">
      <div className="text-center mb-4">
        <div className="text-5xl mb-3">🌬️</div>
        <h3 className="text-2xl font-bold mb-2">Recovery Breath</h3>
        <p className="text-slate-300 mb-1">Life happened. Want to save your {brokenStreak}-day streak?</p>
        <p className="text-slate-400 text-sm">Pick a quest to restore it:</p>
      </div>

      <div className="space-y-3 mb-4">
        {Object.entries(quests).map(([key, quest]) => (
          <button
            key={key}
            onClick={() => onSelectQuest(key)}
            className={`w-full bg-gradient-to-br ${quest.color} border ${quest.border} rounded-xl p-4 hover:scale-105 transition text-left`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{quest.emoji}</span>
              <div className="flex-1">
                <div className="font-bold">{quest.name}</div>
                <div className="text-sm text-slate-400">{quest.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition font-medium"
      >
        Let It Go →
      </button>

      <p className="text-xs text-center text-slate-500 mt-3">
        💎 Your best: {brokenStreak} days - this stays forever!
      </p>
    </div>
  );
}

// Check-in Modal Component - Gratitude & Happiness Source Tracker
// Inline Check-In Component (embedded on Timer tab)
function InlineCheckin({ onSave }) {
  const [step, setStep] = useState('source');
  const [sources, setSources] = useState([]);

  // Get config based on time and whether ritual was done
  const [checkinConfig, setCheckinConfig] = useState(() => getCheckinConfig());
  const { ritual, isRitual, timeOfDay } = checkinConfig;

  // Recalculate config periodically (every minute) to detect ritual changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newConfig = getCheckinConfig();
      setCheckinConfig(newConfig);
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Carousel for quotes
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * wisdomQuotes.length));
  const quote = wisdomQuotes[quoteIndex];

  const nextQuote = () => {
    setQuoteIndex((quoteIndex + 1) % wisdomQuotes.length);
  };

  const prevQuote = () => {
    setQuoteIndex((quoteIndex - 1 + wisdomQuotes.length) % wisdomQuotes.length);
  };

  // Carousel for exercises - use CBT exercises when "nothing" is selected
  const isNothing = sources.includes('nothing');
  const exercisesToShow = isNothing ? cbtExercises : exercises;
  const [exerciseIndex, setExerciseIndex] = useState(() => {
    return Math.floor(Math.random() * (isNothing ? cbtExercises.length : exercises.length));
  });

  // For "nothing" flow, we need separate index for regular exercises
  const [regularExerciseIndex, setRegularExerciseIndex] = useState(() => {
    return Math.floor(Math.random() * exercises.length);
  });

  const exercise = exercisesToShow[exerciseIndex % exercisesToShow.length];
  const regularExercise = exercises[regularExerciseIndex % exercises.length];

  const nextExercise = () => {
    setExerciseIndex((exerciseIndex + 1) % exercisesToShow.length);
  };

  const prevExercise = () => {
    setExerciseIndex((exerciseIndex - 1 + exercisesToShow.length) % exercisesToShow.length);
  };

  const nextRegularExercise = () => {
    setRegularExerciseIndex((regularExerciseIndex + 1) % (exercises.length + 1));
  };

  const prevRegularExercise = () => {
    setRegularExerciseIndex((regularExerciseIndex - 1 + exercises.length + 1) % (exercises.length + 1));
  };

  // Share modal states
  const [showQuoteShare, setShowQuoteShare] = useState(false);
  const [showExerciseShare, setShowExerciseShare] = useState(false);
  const [exerciseToShare, setExerciseToShare] = useState(null);

  // Favorite tracking
  const [favoriteQuotes, setFavoriteQuotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('happinessFavoriteQuotes') || '[]');
    } catch {
      return [];
    }
  });

  const [favoriteExercises, setFavoriteExercises] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('happinessFavoriteExercises') || '[]');
    } catch {
      return [];
    }
  });

  const [favoriteCBT, setFavoriteCBT] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('happinessFavoriteCBT') || '[]');
    } catch {
      return [];
    }
  });

  const isQuoteFavorite = favoriteQuotes.includes(quoteIndex);
  const isExerciseFavorite = isNothing
    ? favoriteCBT.includes(exerciseIndex)
    : favoriteExercises.includes(exerciseIndex);
  const isRegularExerciseFavorite = favoriteExercises.includes(regularExerciseIndex);

  const toggleQuoteFavorite = () => {
    const newFavorites = isQuoteFavorite
      ? favoriteQuotes.filter(i => i !== quoteIndex)
      : [...favoriteQuotes, quoteIndex];
    setFavoriteQuotes(newFavorites);
    localStorage.setItem('happinessFavoriteQuotes', JSON.stringify(newFavorites));

    // Update global favorites counter
    if (isQuoteFavorite) {
      decrementQuoteFavorite(quoteIndex);
    } else {
      incrementQuoteFavorite(quoteIndex);
    }
  };

  const toggleExerciseFavorite = () => {
    if (isNothing) {
      // Handle CBT exercise favorites separately
      const newFavorites = isExerciseFavorite
        ? favoriteCBT.filter(i => i !== exerciseIndex)
        : [...favoriteCBT, exerciseIndex];
      setFavoriteCBT(newFavorites);
      localStorage.setItem('happinessFavoriteCBT', JSON.stringify(newFavorites));

      // Update global CBT favorites counter
      if (isExerciseFavorite) {
        decrementCBTFavorite(exerciseIndex);
      } else {
        incrementCBTFavorite(exerciseIndex);
      }
    } else {
      // Handle regular exercise favorites
      const newFavorites = isExerciseFavorite
        ? favoriteExercises.filter(i => i !== exerciseIndex)
        : [...favoriteExercises, exerciseIndex];
      setFavoriteExercises(newFavorites);
      localStorage.setItem('happinessFavoriteExercises', JSON.stringify(newFavorites));

      // Update global favorites counter
      if (isExerciseFavorite) {
        decrementExerciseFavorite(exerciseIndex);
      } else {
        incrementExerciseFavorite(exerciseIndex);
      }
    }
  };

  const toggleRegularExerciseFavorite = () => {
    const newFavorites = isRegularExerciseFavorite
      ? favoriteExercises.filter(i => i !== regularExerciseIndex)
      : [...favoriteExercises, regularExerciseIndex];
    setFavoriteExercises(newFavorites);
    localStorage.setItem('happinessFavoriteExercises', JSON.stringify(newFavorites));

    if (isRegularExerciseFavorite) {
      decrementExerciseFavorite(regularExerciseIndex);
    } else {
      incrementExerciseFavorite(regularExerciseIndex);
    }
  };

  const selectedSources = ritual.sources.filter(s => sources.includes(s.id));

  const toggleSource = (id) => {
    setSources(prev => {
      // If clicking "nothing" or "everything"
      if (id === 'nothing' || id === 'everything') {
        // If already selected, deselect it
        if (prev.includes(id)) {
          return prev.filter(s => s !== id);
        }
        // Otherwise, select only this one (clear all others)
        return [id];
      }

      // If clicking a regular option, remove "nothing" and "everything"
      const filtered = prev.filter(s => s !== 'nothing' && s !== 'everything');
      // Then toggle this option
      return filtered.includes(id)
        ? filtered.filter(s => s !== id)
        : [...filtered, id];
    });
  };

  const handleSave = () => {
    // Mark ritual as done if this was a ritual check-in
    if (isRitual && timeOfDay !== 'afternoon') {
      markRitualDone(timeOfDay);
    }

    onSave({ sources, quote: quote.author, timeOfDay, isRitual });

    // Reset form for next check-in
    setSources([]);
    setStep('source');
  };

  const handleSkip = () => {
    // Mark ritual as done even if skipped
    if (isRitual && timeOfDay !== 'afternoon') {
      markRitualDone(timeOfDay);
    }

    onSave({ sources: [], quote: quote.author, timeOfDay, isRitual });

    // Reset form for next check-in
    setSources([]);
    setStep('source');
  };

  // Determine which steps to show based on flow
  // New simplified logic:
  // - "nothing" selected: source → cbtExercise (help them feel better)
  // - "everything" or any sources: source only (they're already happy!)
  const isEverything = sources.includes('everything');
  const steps = isNothing
    ? ['source', 'cbtExercise']  // Only CBT for users needing help
    : ['source'];  // Just source selection for happy users

  return (
    <>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl w-full p-6 border border-green-400/20 mb-4">
        
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">{ritual.emoji}</div>
          <h2 className="text-xl font-bold">{ritual.greeting}</h2>
          <p className="text-green-400 text-base font-medium mt-2">
            {ritual.checkinPrompt}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-5">
          {steps.map(s => (
            <button key={s} onClick={() => setStep(s)} className={`w-2.5 h-2.5 rounded-full transition ${step === s ? 'bg-green-400' : 'bg-white/20'}`} />
          ))}
        </div>

        {step === 'source' && (
          <>
            <p className="text-center text-slate-300 mb-2">{ritual.sourcePrompt}</p>
            <p className="text-center text-slate-500 text-xs mb-4">Select all that apply</p>

            {/* Special options: Nothing and Everything */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => toggleSource('nothing')}
                className={`p-3 rounded-xl text-sm text-left transition ${sources.includes('nothing') ? 'bg-blue-400/20 border border-blue-400/50' : 'bg-white/5 hover:bg-white/10'}`}
              >
                😔 Nothing right now
              </button>
              <button
                onClick={() => toggleSource('everything')}
                className={`p-3 rounded-xl text-sm text-left transition ${sources.includes('everything') ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5 hover:bg-white/10'}`}
              >
                ✨ Everything!
              </button>
            </div>

            {/* Regular source options */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {ritual.sources.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleSource(s.id)}
                  className={`p-3 rounded-xl text-sm text-left transition ${sources.includes(s.id) ? 'bg-green-400/20 border border-green-400/50' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => isNothing ? setStep('cbtExercise') : handleSave()}
              disabled={sources.length === 0}
              className={`w-full bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl ${sources.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition'}`}
            >
              {isNothing ? 'Continue →' : '✓ Complete Check-in'}
            </button>
          </>
        )}

        {/* Wisdom step removed from happy user flow - only used in old modal */}
        {false && step === 'wisdom' && (
          <>
            <p className="text-center text-xs text-slate-400 mb-3">{quoteIndex + 1} of {wisdomQuotes.length}</p>
            <div className="border-l-4 border-green-400 bg-white/5 p-4 rounded-r-xl mb-3">
              <p className="text-lg italic mb-2">"{quote.text}"</p>
              <p className="text-green-400 font-medium">— {quote.author}</p>
              <p className="text-slate-400 text-sm">{quote.tradition}</p>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={prevQuote}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={toggleQuoteFavorite}
                className={`px-4 py-2 rounded-xl transition ${isQuoteFavorite ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-400'}`}
                title={isQuoteFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isQuoteFavorite ? '❤️' : '🤍'}
              </button>
              <button
                onClick={nextQuote}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold transition text-sm"
              >
                Next →
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => shareQuote(quote, addPoints)}
                className="flex-1 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm flex items-center justify-center gap-2 hover:bg-purple-500/30 transition"
              >
                📤 Share Text
              </button>
              <button
                onClick={() => setShowQuoteShare(true)}
                className="flex-1 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 text-sm flex items-center justify-center gap-2 hover:bg-pink-500/30 transition"
              >
                📸 Share Image
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(isNothing ? 'cbtExercise' : 'source')} className="flex-1 bg-white/10 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep(isNothing ? 'regularExercise' : 'exercise')} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
            </div>
          </>
        )}

        {step === 'cbtExercise' && (
          <>
            <p className="text-center text-blue-300 text-sm mb-3">💙 Let's help you feel better</p>
            <p className="text-center text-xs text-slate-400 mb-3">{exerciseIndex + 1} of {cbtExercises.length}</p>
            <div className="bg-blue-400/10 border-blue-400/30 border rounded-xl p-4 mb-3">
              <h3 className="text-blue-400 font-semibold mb-1">💙 {exercise.title}</h3>
              <p className="text-slate-400 text-sm mb-2">{exercise.subtitle}</p>
              {exercise.description && (
                <p className="text-slate-300 text-sm mb-3 italic">{exercise.description}</p>
              )}
              {exercise.pattern && <BreathingGuide pattern={exercise.pattern} />}
              <ul className="space-y-1 text-sm mt-3">
                {exercise.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-400">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={prevExercise}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={toggleExerciseFavorite}
                className={`px-4 py-2 rounded-xl transition ${isExerciseFavorite ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-400'}`}
                title={isExerciseFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isExerciseFavorite ? '❤️' : '🤍'}
              </button>
              <button
                onClick={nextExercise}
                className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 rounded-xl font-semibold transition text-sm"
              >
                Next →
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => shareExercise(exercise, addPoints)}
                className="flex-1 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm flex items-center justify-center gap-2 hover:bg-blue-500/30 transition"
              >
                📤 Share Text
              </button>
              <button
                onClick={() => {
                  setExerciseToShare(exercise);
                  setShowExerciseShare(true);
                }}
                className="flex-1 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm flex items-center justify-center gap-2 hover:bg-teal-500/30 transition"
              >
                📸 Share Image
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSkip} className="flex-1 bg-white/10 py-3 rounded-xl">Skip & Save</button>
              <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">✓ Complete</button>
            </div>
          </>
        )}

        {step === 'exercise' && (
          <>
            <p className="text-center text-xs text-slate-400 mb-3">{exerciseIndex + 1} of {exercisesToShow.length}</p>
            <div className={`${exercise.isNightOnly ? 'bg-indigo-400/10 border-indigo-400/30' : 'bg-green-400/10 border-green-400/30'} border rounded-xl p-4 mb-3`}>
              <h3 className={`${exercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'} font-semibold mb-1`}>
                {exercise.isNightOnly ? '🌙' : '🧘'} {exercise.title}
              </h3>
              <p className="text-slate-400 text-sm mb-2">{exercise.subtitle}</p>
              {exercise.description && (
                <p className="text-slate-300 text-sm mb-3 italic">{exercise.description}</p>
              )}
              {exercise.pattern && <BreathingGuide pattern={exercise.pattern} />}
              <ul className="space-y-1 text-sm mt-3">
                {exercise.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={exercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'}>{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={prevExercise}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={toggleExerciseFavorite}
                className={`px-4 py-2 rounded-xl transition ${isExerciseFavorite ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-400'}`}
                title={isExerciseFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isExerciseFavorite ? '❤️' : '🤍'}
              </button>
              <button
                onClick={nextExercise}
                className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 rounded-xl font-semibold transition text-sm"
              >
                Next →
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => shareExercise(exercise, addPoints)}
                className="flex-1 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm flex items-center justify-center gap-2 hover:bg-blue-500/30 transition"
              >
                📤 Share Text
              </button>
              <button
                onClick={() => {
                  setExerciseToShare(exercise);
                  setShowExerciseShare(true);
                }}
                className="flex-1 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm flex items-center justify-center gap-2 hover:bg-teal-500/30 transition"
              >
                📸 Share Image
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSkip} className="flex-1 bg-white/10 py-3 rounded-xl">Skip & Save</button>
              <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">✓ Complete</button>
            </div>
          </>
        )}

        {step === 'regularExercise' && (
          <>
            <p className="text-center text-green-300 text-sm mb-3">✨ Now let's build on that momentum</p>
            <p className="text-center text-xs text-slate-400 mb-3">{regularExerciseIndex + 1} of {exercises.length + 1}</p>
            <div className={`${regularExercise.isNightOnly ? 'bg-indigo-400/10 border-indigo-400/30' : 'bg-green-400/10 border-green-400/30'} border rounded-xl p-4 mb-3`}>
              <h3 className={`${regularExercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'} font-semibold mb-1`}>
                {regularExercise.isNightOnly ? '🌙' : '🧘'} {regularExercise.title}
              </h3>
              <p className="text-slate-400 text-sm mb-2">{regularExercise.subtitle}</p>
              {regularExercise.description && (
                <p className="text-slate-300 text-sm mb-3 italic">{regularExercise.description}</p>
              )}
              {regularExercise.pattern && <BreathingGuide pattern={regularExercise.pattern} />}
              <ul className="space-y-1 text-sm mt-3">
                {regularExercise.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={regularExercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'}>{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={prevRegularExercise}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition text-sm"
              >
                ← Previous
              </button>
              <button
                onClick={toggleRegularExerciseFavorite}
                className={`px-4 py-2 rounded-xl transition ${isRegularExerciseFavorite ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-400'}`}
                title={isRegularExerciseFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isRegularExerciseFavorite ? '❤️' : '🤍'}
              </button>
              <button
                onClick={nextRegularExercise}
                className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 rounded-xl font-semibold transition text-sm"
              >
                Next →
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => shareExercise(regularExercise, addPoints)}
                className="flex-1 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm flex items-center justify-center gap-2 hover:bg-blue-500/30 transition"
              >
                📤 Share Text
              </button>
              <button
                onClick={() => {
                  setExerciseToShare(regularExercise);
                  setShowExerciseShare(true);
                }}
                className="flex-1 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm flex items-center justify-center gap-2 hover:bg-teal-500/30 transition"
              >
                📸 Share Image
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSkip} className="flex-1 bg-white/10 py-3 rounded-xl">Skip & Save</button>
              <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">✓ Complete</button>
            </div>
          </>
        )}
      </div>

      {/* Share Image Modals */}
      <ShareImageCard
        isOpen={showQuoteShare}
        onClose={() => setShowQuoteShare(false)}
        type="quote"
        data={quote}
      />
      <ShareImageCard
        isOpen={showExerciseShare}
        onClose={() => setShowExerciseShare(false)}
        type="exercise"
        data={exerciseToShare || exercise}
      />
    </>
  );
}

// Settings Modal
function SettingsModal({ isOpen, onClose, onClearCheckins, onClearAll, stats, checkins, notificationSettings, setNotificationSettings, soundEnabled, setSoundEnabled }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Notifications are not supported in this browser');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      const updatedSettings = { ...notificationSettings, enabled: true };
      setNotificationSettings(updatedSettings);
      localStorage.setItem(`happinessNotificationSettings${CURRENT_YEAR}`, JSON.stringify(updatedSettings));

      // Show test notification
      new Notification('Seeds of Joy 🌱', {
        body: 'Notifications enabled! We\'ll remind you to plant seeds of joy throughout the day.',
        icon: '/pwa-512x512.svg'
      });
    }
  };

  const toggleNotification = () => {
    if (!notificationSettings.enabled) {
      requestNotificationPermission();
    } else {
      const updatedSettings = { ...notificationSettings, enabled: false };
      setNotificationSettings(updatedSettings);
      localStorage.setItem(`happinessNotificationSettings${CURRENT_YEAR}`, JSON.stringify(updatedSettings));
    }
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...notificationSettings.times];
    newTimes[index] = value;
    const updatedSettings = { ...notificationSettings, times: newTimes };
    setNotificationSettings(updatedSettings);
    localStorage.setItem(`happinessNotificationSettings${CURRENT_YEAR}`, JSON.stringify(updatedSettings));
  };

  if (!isOpen) return null;

  const actions = [
    { id: 'checkins', label: 'Clear Check-ins', desc: `${stats.checkins} entries`, onConfirm: onClearCheckins },
    { id: 'all', label: 'Clear All Data', desc: 'Complete reset', onConfirm: onClearAll },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-white/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">⚙️ Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Notifications Section */}
        <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">🔔 Daily Reminders</h3>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300">Enable notifications</span>
            <button
              onClick={toggleNotification}
              className={`w-12 h-6 rounded-full transition-colors ${notificationSettings.enabled ? 'bg-green-500' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${notificationSettings.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {notificationSettings.enabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">🌅 Morning Check-in</span>
                <input
                  type="time"
                  value={notificationSettings.times[0]}
                  onChange={(e) => handleTimeChange(0, e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">☀️ Noon Check-in</span>
                <input
                  type="time"
                  value={notificationSettings.times[1]}
                  onChange={(e) => handleTimeChange(1, e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">🌙 Evening Check-in</span>
                <input
                  type="time"
                  value={notificationSettings.times[2]}
                  onChange={(e) => handleTimeChange(2, e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white"
                />
              </div>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <p className="text-xs text-red-400 mt-2">
              ⚠️ Notifications blocked. Enable in browser settings.
            </p>
          )}

          {typeof Notification === 'undefined' && (
            <p className="text-xs text-slate-400 mt-2">
              📱 Install the app for notifications
            </p>
          )}
        </div>

        {/* Sound Effects Section */}
        <div className="bg-purple-400/10 border border-purple-400/30 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">🔊 Sound Effects</h3>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Gentle sound effects</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-2">
            {soundEnabled ? 'Enjoy delightful chimes on check-ins, points, and milestones' : 'Sound effects are muted'}
          </p>
        </div>

        <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">🔒 Your Privacy</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• All personal data stored locally only</li>
            <li>• Only anonymous counts shared (global counter)</li>
            <li>• No personal info ever leaves your device</li>
            <li>• Clear your data anytime below</li>
          </ul>
        </div>

        {/* Share the App */}
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-pink-400 mb-2 flex items-center gap-2">💝 Share the Happiness</h3>
          <p className="text-sm text-slate-300 mb-3">Help someone you love have a happier {CURRENT_YEAR}</p>
          <button
            onClick={() => {
              const shareText = `Seeds of Joy 🌱\n\nPlant joy, watch it bloom, share it with the world.\n\n✨ Sparks Of Joy - Mental Dojo practices\n🌱 Seeds Of Thought - Wisdom to plant in your mind\n🌬️ Breath Of Fresh Air - Calming patterns\n💙 CBT Tools - Mindset shifts\n\nSmile, and the whole world smileswithyou.com.`;
              shareContent(shareText, 'Shared to clipboard!');
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition"
          >
            💌 Share Your Smile
          </button>
        </div>

        <h3 className="font-semibold mb-3 text-slate-400 text-sm uppercase tracking-wider">Data Management</h3>

        {/* Danger Zone */}
        <div className="space-y-2">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => setConfirmAction(action)}
              className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl text-left transition flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-slate-400">{action.desc}</p>
              </div>
              <span className="text-red-400">🗑️</span>
            </button>
          ))}
        </div>

        {/* Version Info */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-slate-500">Seeds of Joy v{APP_VERSION}</p>
          <p className="text-xs text-slate-600">Build {BUILD_DATE}</p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
        title={`${confirmAction?.label}?`}
        message="This action cannot be undone. Your data will be permanently deleted."
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}

// Main App
export default function App() {
  const [checkins, setCheckins] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`happinessCheckins${CURRENT_YEAR}`) || '[]'); } catch { return []; }
  });

  // Gamification: Points tracking
  const [totalPoints, setTotalPoints] = useState(() => {
    try { return parseInt(localStorage.getItem(`happinessPoints${CURRENT_YEAR}`) || '0'); } catch { return 0; }
  });

  // Track daily points separately
  const [dailyPoints, setDailyPoints] = useState(() => {
    const today = getDayKey(new Date());
    try { return parseInt(localStorage.getItem(`dailyPoints_${today}`) || '0'); } catch { return 0; }
  });

  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsGained, setPointsGained] = useState(0);

  // Track tool usage for encouragements
  const [toolUsageThisWeek, setToolUsageThisWeek] = useState(() => {
    const weekKey = `toolUsage_${getDayKey(new Date())}`;
    try { return parseInt(localStorage.getItem(weekKey) || '0'); } catch { return 0; }
  });

  // Helper function to show encouragement
  const showEncouragement = (type, data = {}) => {
    const messages = encouragementMessages[type];
    if (!messages || messages.length === 0) return;

    let message = messages[Math.floor(Math.random() * messages.length)];
    let text = message.text;

    // Personalize with data
    text = text.replace('{count}', data.count || 0);
    text = text.replace('{s}', (data.count || 0) === 1 ? '' : 's');
    text = text.replace('{streak}', data.streak || 0);
    text = text.replace('{points}', (data.points || 0).toLocaleString());

    setToastMessage(text);
    setToastEmoji(message.emoji);
    setShowToast(true);
  };

  // Helper function to add points
  const addPoints = (points, reason = '') => {
    const newTotal = totalPoints + points;
    setTotalPoints(newTotal);
    localStorage.setItem(`happinessPoints${CURRENT_YEAR}`, newTotal.toString());

    // Track daily points
    const today = getDayKey(new Date());
    const newDailyTotal = dailyPoints + points;
    setDailyPoints(newDailyTotal);
    localStorage.setItem(`dailyPoints_${today}`, newDailyTotal.toString());

    // Show animation
    setPointsGained(points);
    setShowPointsAnimation(true);
    setTimeout(() => setShowPointsAnimation(false), 2000);

    // Track globally
    incrementGlobalJoyPoints(points);

    // Show encouragement for round numbers
    if (newTotal % 100 === 0 && newTotal > 0) {
      setTimeout(() => showEncouragement('roundNumber', { points: newTotal }), 2500);
      setTimeout(() => playSound('points'), 2000);
    }
  };

  // Reset daily points at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const today = getDayKey(new Date());
      const storedDay = localStorage.getItem('currentDay');
      if (storedDay && storedDay !== today) {
        // New day! Reset daily points
        setDailyPoints(0);
        localStorage.setItem(`dailyPoints_${today}`, '0');
      }
      localStorage.setItem('currentDay', today);
    };

    checkMidnight(); // Check on mount
    const interval = setInterval(checkMidnight, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate current rank
  const getCurrentRank = () => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (totalPoints >= RANKS[i].minPoints) {
        return RANKS[i];
      }
    }
    return RANKS[0];
  };

  const currentRank = getCurrentRank();
  const nextRank = RANKS[currentRank.level + 1];
  const pointsToNextRank = nextRank ? nextRank.minPoints - totalPoints : 0;

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneData, setMilestoneData] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareSmile, setShowShareSmile] = useState(false);
  const [activeTab, setActiveTab] = useState('timer');
  const [showReminder, setShowReminder] = useState(false);
  const [showQuoteBrowser, setShowQuoteBrowser] = useState(false);
  const [showExerciseBrowser, setShowExerciseBrowser] = useState(false);
  const [showBreathworkBrowser, setShowBreathworkBrowser] = useState(false);
  const [showCBTBrowser, setShowCBTBrowser] = useState(false);
  const [showRipplesModal, setShowRipplesModal] = useState(false);
  const [showPowerBoost, setShowPowerBoost] = useState(false);
  const [checkInCooldownUntil, setCheckInCooldownUntil] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastEmoji, setToastEmoji] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Streak recovery state
  const [recoveryActive, setRecoveryActive] = useState(false);
  const [recoveryQuest, setRecoveryQuest] = useState(null); // 'triple', 'tools', 'bookend'
  const [brokenStreak, setBrokenStreak] = useState(0);
  const [recoveryProgress, setRecoveryProgress] = useState({
    checkins: 0,
    tools: 0,
    morning: false,
    evening: false,
  });
  const [recoveryUsedToday, setRecoveryUsedToday] = useState(() => {
    const today = getDayKey(new Date());
    return localStorage.getItem(`recoveryUsed_${today}`) === 'true';
  });
  const [maxStreak, setMaxStreak] = useState(() => {
    try { return parseInt(localStorage.getItem(`maxStreak${CURRENT_YEAR}`) || '0'); } catch { return 0; }
  });

  // Version update notification
  const { updateAvailable, newVersion } = useVersionCheck(APP_VERSION);
  const [showUpdateNotification, setShowUpdateNotification] = useState(true);

  // Track which milestones have been celebrated
  const [celebratedMilestones, setCelebratedMilestones] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`happinessCelebratedMilestones${CURRENT_YEAR}`) || '[]'); } catch { return []; }
  });

  // Save celebrated milestones
  useEffect(() => {
    localStorage.setItem(`happinessCelebratedMilestones${CURRENT_YEAR}`, JSON.stringify(celebratedMilestones));
  }, [celebratedMilestones]);

  // Check-in cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, checkInCooldownUntil - Date.now());
      setCooldownRemaining(remaining);
    }, 100);
    return () => clearInterval(interval);
  }, [checkInCooldownUntil]);

  // Show welcome encouragement on app open (once per session)
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem('welcomeShown');
    if (!hasShownWelcome) {
      setTimeout(() => showEncouragement('appOpen'), 1000);
      sessionStorage.setItem('welcomeShown', 'true');
    }
  }, []);

  // Track active users globally (only once per session)
  useEffect(() => {
    const sessionKey = `happinessSessionTracked${CURRENT_YEAR}`;
    const alreadyTracked = sessionStorage.getItem(sessionKey);

    if (!alreadyTracked) {
      incrementActiveStreaks();
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, []);

  // Suppress PWA install prompt (prevent it from showing repeatedly)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event if you want to trigger it manually later
      // For now, we'll just suppress it to avoid annoying users
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle app shortcuts (URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'checkin') {
      setShowCheckinModal(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(`happinessNotificationSettings${CURRENT_YEAR}`);
      return stored ? JSON.parse(stored) : {
        enabled: false,
        times: ['09:00', '12:00', '18:00'] // morning, noon, evening
      };
    } catch {
      return {
        enabled: false,
        times: ['09:00', '12:00', '18:00']
      };
    }
  });

  // Sound effects settings (default ON)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('happinessSoundEnabled');
    return stored === null ? true : stored === 'true';
  });

  // Save sound settings
  useEffect(() => {
    localStorage.setItem('happinessSoundEnabled', soundEnabled.toString());
  }, [soundEnabled]);

  // Helper to play sound if enabled
  const playSound = (soundType) => {
    if (soundEnabled && soundSystem) {
      soundSystem[soundType]?.();
    }
  };

  // Request notification permission on first load
  useEffect(() => {
    const hasAsked = localStorage.getItem('happinessNotificationAsked');

    if (!hasAsked && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      // Ask for permission after a short delay so user isn't immediately bombarded
      setTimeout(() => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            setNotificationSettings(prev => ({ ...prev, enabled: true }));
            localStorage.setItem(`happinessNotificationSettings${CURRENT_YEAR}`, JSON.stringify({
              enabled: true,
              times: ['09:00', '12:00', '18:00']
            }));
          }
          localStorage.setItem('happinessNotificationAsked', 'true');
        });
      }, 5000); // Wait 5 seconds after app loads
    }
  }, []);

  // Save notification settings
  useEffect(() => {
    localStorage.setItem(`happinessNotificationSettings${CURRENT_YEAR}`, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Check for notification reminders (multiple times per day)
  useEffect(() => {
    const checkReminders = () => {
      if (!notificationSettings.enabled) return;

      const now = new Date();
      const today = getDayKey(now);
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      notificationSettings.times.forEach((reminderTime, index) => {
        const reminderKey = `happinessLastReminder${index}_${CURRENT_YEAR}`;
        const lastReminder = localStorage.getItem(reminderKey);

        const [hours, minutes] = reminderTime.split(':').map(Number);
        const reminderMinutes = hours * 60 + minutes;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Check if we're within 1 minute of reminder time and haven't shown it today
        if (Math.abs(currentMinutes - reminderMinutes) <= 1 && lastReminder !== today) {
          // Check if user already checked in today
          const todayCheckins = checkins.filter(c =>
            getDayKey(c.timestamp) === today
          ).length;

          if (todayCheckins === 0) {
            // Show browser notification if permitted
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              const timeLabels = ['Morning', 'Noon', 'Evening'];
              new Notification(`${timeLabels[index]} Happiness Check-in 🌟`, {
                body: 'Take a moment to reflect on what\'s bringing you joy today!',
                icon: '/pwa-512x512.svg',
                tag: `happiness-reminder-${index}`,
                requireInteraction: false
              });
            }
            setShowReminder(true);
          }
          localStorage.setItem(reminderKey, today);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkins, notificationSettings]);

  // Save checkins to localStorage
  useEffect(() => {
    localStorage.setItem(`happinessCheckins${CURRENT_YEAR}`, JSON.stringify(checkins));
  }, [checkins]);

  const handleCheckinSave = ({ sources, quote, timeOfDay, isRitual }) => {
    const checkin = {
      id: Date.now(),
      sources: sources || [],
      quote,
      timestamp: new Date().toISOString()
    };

    // Calculate what streak will be after this check-in
    const newCheckins = [...checkins, checkin];
    const days = [...new Set(newCheckins.map(c => getDayKey(c.timestamp)))].sort().reverse();
    let newStreak = 0;
    for (let i = 0; i < days.length; i++) {
      const expected = getDayKey(new Date(Date.now() - i * 86400000));
      if (days.includes(expected) || (i === 0 && days[0] === getDayKey(new Date(Date.now() - 86400000)))) {
        newStreak++;
      } else if (i > 0) break;
    }

    setCheckins(newCheckins);

    // Gamification: Award points for check-in
    let pointsEarned = POINTS.BASE_CHECKIN;

    // Points per happiness source (max 6 sources to prevent gaming)
    const validSources = sources.filter(s => s !== 'nothing' && s !== 'everything').slice(0, 6);
    pointsEarned += validSources.length * POINTS.PER_SOURCE;

    // Bonus for "Everything!"
    if (sources.includes('everything')) {
      pointsEarned += POINTS.EVERYTHING_BONUS;
    }

    // First check-in of the day bonus
    const today = getDayKey(new Date());
    const todayCheckins = newCheckins.filter(c => getDayKey(c.timestamp) === today);
    if (todayCheckins.length === 1) {
      pointsEarned += POINTS.FIRST_CHECKIN;
    }

    // Ritual bonuses
    if (isRitual) {
      if (timeOfDay === 'morning') pointsEarned += POINTS.MORNING_RITUAL;
      if (timeOfDay === 'evening') pointsEarned += POINTS.EVENING_RITUAL;
      if (timeOfDay === 'night') pointsEarned += POINTS.NIGHT_RITUAL;
    }

    addPoints(pointsEarned);

    // Confetti celebration for check-in
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    // Play check-in sound
    playSound('checkIn');

    // Show encouragement after check-in
    setTimeout(() => showEncouragement('afterCheckIn', { count: todayCheckins.length, streak: newStreak }), 3500);

    // Check for milestone celebration
    if (milestoneThresholds.includes(newStreak) && !celebratedMilestones.includes(newStreak)) {
      const badge = streakBadges.find(b => b.threshold === newStreak);
      setMilestoneData({ streak: newStreak, badge });
      setShowConfetti(true);
      setTimeout(() => setShowMilestone(true), 500);
      setTimeout(() => setShowConfetti(false), 4000);
      setCelebratedMilestones(prev => [...prev, newStreak]);
      // Play milestone celebration sound
      setTimeout(() => playSound('milestone'), 600);
    }
    
    // Increment global counters
    incrementCheckins();
    // Increment each selected source
    (sources || []).forEach(source => {
      incrementHappinessSource(source);
    });

    // Track recovery progress if active
    if (recoveryActive && recoveryQuest) {
      const hour = new Date().getHours();
      const isMorning = hour >= 5 && hour < 12;
      const isEvening = hour >= 17 && hour < 23;

      setRecoveryProgress(prev => ({
        ...prev,
        checkins: prev.checkins + 1,
        morning: prev.morning || isMorning,
        evening: prev.evening || isEvening,
      }));
    }

    // Show power boost menu for happy check-ins
    const isHappyCheckIn = sources && sources.length > 0 && !sources.includes('nothing');
    if (isHappyCheckIn) {
      setShowPowerBoost(true);
    }
  };

  const handlePowerBoostSkip = () => {
    setShowPowerBoost(false);
    setCheckInCooldownUntil(Date.now() + 60000); // 60 second cooldown
  };

  const handlePowerBoostSelect = (tool) => {
    setShowPowerBoost(false);
    setCheckInCooldownUntil(Date.now() + 60000); // 60 second cooldown

    // Open the appropriate browser modal
    switch (tool) {
      case 'quotes':
        setShowQuoteBrowser(true);
        break;
      case 'exercises':
        setShowExerciseBrowser(true);
        break;
      case 'breathwork':
        setShowBreathworkBrowser(true);
        break;
      case 'cbt':
        setShowCBTBrowser(true);
        break;
    }
  };

  const handleToolBoost = () => {
    // Track tool usage
    const weekKey = `toolUsage_${getDayKey(new Date())}`;
    const newCount = toolUsageThisWeek + 1;
    setToolUsageThisWeek(newCount);
    localStorage.setItem(weekKey, newCount.toString());

    // Track recovery progress if active
    if (recoveryActive && recoveryQuest === 'tools') {
      setRecoveryProgress(prev => ({
        ...prev,
        tools: prev.tools + 1,
      }));
    }

    // Play power boost sound
    playSound('powerBoost');

    // Show encouragement (every 5 tools or on milestones)
    if (newCount % 5 === 0 || [3, 7, 10, 15, 20].includes(newCount)) {
      setTimeout(() => showEncouragement('afterPowerBoost', { count: newCount }), 1000);
    }
  };

  const handleDeleteCheckin = (id) => {
    setCheckins(prev => prev.filter(c => c.id !== id));
  };

  const handleClearCheckins = () => {
    setCheckins([]);
    localStorage.removeItem(`happinessCheckins${CURRENT_YEAR}`);
  };

  const handleClearAll = () => {
    setCheckins([]);
    localStorage.removeItem(`happinessCheckins${CURRENT_YEAR}`);
  };

  // Calculate check-in streak (days in a row)
  const getCheckinStreak = () => {
    if (checkins.length === 0) return 0;
    const days = [...new Set(checkins.map(c => getDayKey(c.timestamp)))].sort().reverse();
    let streak = 0;
    for (let i = 0; i < days.length; i++) {
      const expected = getDayKey(new Date(Date.now() - i * 86400000));
      if (days.includes(expected) || (i === 0 && days[0] === getDayKey(new Date(Date.now() - 86400000)))) {
        streak++;
      } else if (i > 0) break;
    }
    return streak;
  };

  const checkinStreak = getCheckinStreak();
  const todayCheckins = checkins.filter(c => getDayKey(c.timestamp) === getDayKey(new Date())).length;

  // Detect streak break and offer recovery
  useEffect(() => {
    if (recoveryUsedToday || recoveryActive) return; // Already used or active

    const today = getDayKey(new Date());
    const yesterday = getDayKey(new Date(Date.now() - 86400000));
    const dayBeforeYesterday = getDayKey(new Date(Date.now() - 2 * 86400000));

    // Check if yesterday is missing but we had a streak before
    const hasYesterday = checkins.some(c => getDayKey(c.timestamp) === yesterday);
    const hasToday = checkins.some(c => getDayKey(c.timestamp) === today);
    const hadStreakBefore = checkins.some(c => getDayKey(c.timestamp) === dayBeforeYesterday);

    // Streak broken: yesterday missing, had streak before, haven't checked in today yet
    if (!hasYesterday && hadStreakBefore && !hasToday) {
      // Calculate what the streak was before it broke
      const daysWithCheckins = [...new Set(checkins.map(c => getDayKey(c.timestamp)))].sort().reverse();
      let previousStreak = 0;
      for (let i = 1; i < daysWithCheckins.length + 1; i++) {
        const expected = getDayKey(new Date(Date.now() - i * 86400000));
        if (daysWithCheckins.includes(expected)) {
          previousStreak++;
        } else {
          break;
        }
      }

      if (previousStreak > 0) {
        setBrokenStreak(previousStreak);
        setRecoveryActive(true);
        // Update max streak if this was the highest
        if (previousStreak > maxStreak) {
          setMaxStreak(previousStreak);
          localStorage.setItem(`maxStreak${CURRENT_YEAR}`, previousStreak.toString());
        }
      }
    }
  }, [checkins, recoveryUsedToday, recoveryActive, maxStreak]);

  // Check for quest completion and restore streak
  useEffect(() => {
    if (!recoveryActive || !recoveryQuest) return;

    let isComplete = false;

    switch (recoveryQuest) {
      case 'triple':
        isComplete = recoveryProgress.checkins >= 3;
        break;
      case 'tools':
        isComplete = recoveryProgress.tools >= 3;
        break;
      case 'bookend':
        isComplete = recoveryProgress.morning && recoveryProgress.evening;
        break;
    }

    if (isComplete) {
      // Restore the streak by adding a backdated check-in for yesterday
      const yesterday = new Date(Date.now() - 86400000);
      const recoveryCheckin = {
        id: Date.now() - 1, // Unique ID
        sources: ['recovery'],
        quote: '🌬️ Recovery Breath - You showed up when it mattered',
        timestamp: yesterday.toISOString()
      };

      setCheckins(prev => [...prev, recoveryCheckin]);

      // Celebrate!
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      playSound('milestone');

      // Show success message
      setTimeout(() => {
        setToastMessage(`✨ Quest Complete! Your ${brokenStreak}-day streak has been restored! ✨`);
        setToastEmoji('🌬️');
        setShowToast(true);
      }, 500);

      // Reset recovery state
      setTimeout(() => {
        setRecoveryActive(false);
        setRecoveryQuest(null);
        setBrokenStreak(0);
        setRecoveryProgress({ checkins: 0, tools: 0, morning: false, evening: false });

        const today = getDayKey(new Date());
        localStorage.setItem(`recoveryUsed_${today}`, 'true');
        setRecoveryUsedToday(true);
      }, 3000);
    }
  }, [recoveryActive, recoveryQuest, recoveryProgress, brokenStreak, playSound]);

  // Update max streak when current streak exceeds it
  useEffect(() => {
    if (checkinStreak > maxStreak) {
      setMaxStreak(checkinStreak);
      localStorage.setItem(`maxStreak${CURRENT_YEAR}`, checkinStreak.toString());
    }
  }, [checkinStreak, maxStreak]);

  // Reset recovery availability on new day
  useEffect(() => {
    const today = getDayKey(new Date());
    const storedDay = localStorage.getItem('lastRecoveryCheckDay');

    if (storedDay && storedDay !== today) {
      // New day - reset recovery availability
      setRecoveryUsedToday(false);
      setRecoveryProgress({ checkins: 0, tools: 0, morning: false, evening: false });
    }

    localStorage.setItem('lastRecoveryCheckDay', today);
  }, [checkins]); // Run when checkins change (new check-in triggers day check)

  // Auto-check-in on site visit
  useEffect(() => {
    const today = getDayKey(new Date());
    const hasCheckedInToday = checkins.some(c => getDayKey(c.timestamp) === today);

    // Only auto-check-in if user hasn't checked in today
    if (!hasCheckedInToday && checkins.length >= 0) {
      // Create a simple auto check-in (silent, no points/confetti)
      const autoCheckin = {
        id: Date.now(),
        sources: ['peace'], // simple default source
        quote: null,
        timestamp: new Date().toISOString(),
        auto: true // mark as auto so we can track it
      };

      setCheckins(prev => [...prev, autoCheckin]);
      incrementCheckins();
      incrementHappinessSource('peace');
    }
  }, []); // Run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4">
      {/* Version Update Notification */}
      <UpdateNotification
        isVisible={updateAvailable && showUpdateNotification}
        newVersion={newVersion}
        onDismiss={() => setShowUpdateNotification(false)}
      />

      <div className="max-w-xl mx-auto">
        {/* Header */}
        <header className="text-center py-3">
          <div className="flex items-center justify-between mb-1">
            <div className="w-8" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">🌱 Seeds of Joy ✨</h1>
            <button onClick={() => setShowSettingsModal(true)} className="text-slate-400 hover:text-white text-xl">⚙️</button>
          </div>
          <p className="text-slate-400 text-xs mb-2">Plant joy, watch it bloom, share it with the world</p>
        </header>

        {/* No tab navigation - single page interface */}

        {/* Main Content */}
        <>
          {/* Global Counter */}
            <div className="mb-4">
              <GlobalCounter />
            </div>

            {/* Tools Grid - Main Navigation */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Seeds Of Thought */}
              <button
                onClick={() => setShowQuoteBrowser(true)}
                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-5 hover:from-purple-500/30 hover:to-pink-500/30 transition hover:scale-105 flex flex-col items-center gap-2"
              >
                <div className="text-4xl">🌱</div>
                <div className="font-semibold text-sm">Seeds Of Thought</div>
                <div className="text-xs text-slate-400 text-center">Wisdom to plant</div>
              </button>

              {/* Sparks Of Joy */}
              <button
                onClick={() => setShowExerciseBrowser(true)}
                className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-5 hover:from-orange-500/30 hover:to-yellow-500/30 transition hover:scale-105 flex flex-col items-center gap-2"
              >
                <div className="text-4xl">✨</div>
                <div className="font-semibold text-sm">Sparks Of Joy</div>
                <div className="text-xs text-slate-400 text-center">Mental Dojo</div>
              </button>

              {/* Breath Of Fresh Air */}
              <button
                onClick={() => setShowBreathworkBrowser(true)}
                className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-xl p-5 hover:from-teal-500/30 hover:to-cyan-500/30 transition hover:scale-105 flex flex-col items-center gap-2"
              >
                <div className="text-4xl">🌬️</div>
                <div className="font-semibold text-sm">Breath Of Fresh Air</div>
                <div className="text-xs text-slate-400 text-center">1-minute calm</div>
              </button>

              {/* Tools Of Thought */}
              <button
                onClick={() => setShowCBTBrowser(true)}
                className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-5 hover:from-blue-500/30 hover:to-indigo-500/30 transition hover:scale-105 flex flex-col items-center gap-2"
              >
                <div className="text-4xl">🧠</div>
                <div className="font-semibold text-sm">Tools Of Thought</div>
                <div className="text-xs text-slate-400 text-center">Mindset shifts</div>
              </button>

              {/* Share A Smile */}
              <button
                onClick={() => setShowShareSmile(true)}
                className="bg-gradient-to-br from-amber-500/20 to-pink-500/20 border border-amber-500/30 rounded-xl p-5 hover:from-amber-500/30 hover:to-pink-500/30 transition hover:scale-105 flex flex-col items-center gap-2"
              >
                <div className="text-4xl">💛</div>
                <div className="font-semibold text-sm">Share A Smile</div>
                <div className="text-xs text-slate-400 text-center">Send joy</div>
              </button>

              {/* Ripples Of Joy */}
              <button
                onClick={() => setShowRipplesModal(true)}
                className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-5 hover:from-cyan-500/30 hover:to-blue-500/30 transition hover:scale-105 flex flex-col items-center gap-2"
              >
                <div className="text-4xl">🌊</div>
                <div className="font-semibold text-sm">Ripples Of Joy</div>
                <div className="text-xs text-slate-400 text-center">Witness sparks</div>
              </button>
            </div>

            {/* Hidden: Inline Check-In - kept for backend logic */}
            <div style={{ display: 'none' }}>
              {recoveryActive ? (
                <RecoveryQuest
                  brokenStreak={brokenStreak}
                  progress={recoveryProgress}
                  activeQuest={recoveryQuest}
                  onSelectQuest={(quest) => setRecoveryQuest(quest)}
                  onSkip={() => {
                    setRecoveryActive(false);
                    setRecoveryQuest(null);
                    setBrokenStreak(0);
                    const today = getDayKey(new Date());
                    localStorage.setItem(`recoveryUsed_${today}`, 'true');
                    setRecoveryUsedToday(true);
                  }}
                />
              ) : showPowerBoost ? (
                <PowerBoost
                  onSkip={handlePowerBoostSkip}
                  onSelectTool={handlePowerBoostSelect}
                />
              ) : cooldownRemaining > 0 ? (
                <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-4 border border-white/10 text-center">
                  <p className="text-slate-400 text-sm mb-2">Taking a happiness break...</p>
                  <p className="text-2xl font-bold text-purple-400">{Math.ceil(cooldownRemaining / 1000)}s</p>
                  <p className="text-xs text-slate-500 mt-2">Next check-in available soon</p>
                </div>
              ) : (
                <InlineCheckin onSave={handleCheckinSave} />
              )}
            </div>
            
            <div className="bg-white/5 backdrop-blur rounded-2xl p-5 mb-4 border border-white/10 relative overflow-hidden">
              {/* Points Animation */}
              {showPointsAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="text-4xl font-bold text-yellow-400 animate-bounce">
                    +{pointsGained} 🎉
                  </div>
                </div>
              )}

              {/* Day Streak Display */}
              <div className="text-center mb-4">
                <p className="text-slate-400 uppercase tracking-widest text-xs mb-2">Your Streak</p>
                <div className="text-5xl font-bold text-green-400 mb-1">{checkinStreak}</div>
                <p className="text-slate-400 text-sm">{checkinStreak === 1 ? 'day' : 'days'} of happiness 🔥</p>
              </div>

              {todayCheckins > 0 ? (
                <p className="text-green-400 mb-4 flex items-center justify-center gap-2 text-sm">
                  <span className="animate-pulse">💚</span> You checked in {todayCheckins} time{todayCheckins > 1 ? 's' : ''} today! <span className="animate-pulse">💚</span>
                </p>
              ) : (
                <p className="text-yellow-400 mb-4 flex items-center justify-center gap-2 text-sm">
                  <span>✨</span> Check in to keep your streak going! <span>✨</span>
                </p>
              )}

              {/* Today's Joy Points */}
              <div className="text-center mb-4 pt-3 border-t border-white/10">
                <p className="text-slate-400 uppercase tracking-widest text-xs mb-2">Today's Joy</p>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {dailyPoints.toLocaleString()} <span className="text-lg">points</span>
                </div>
              </div>

              {/* Rank Progress Bar */}
              <div className="mb-4 pt-3 border-t border-white/10">
                <p className="text-slate-400 uppercase tracking-widest text-xs mb-2 text-center">
                  {currentRank.emoji} {currentRank.name} • {totalPoints.toLocaleString()} pts
                </p>
                {nextRank && (
                  <>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((totalPoints - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-purple-300">{pointsToNextRank.toLocaleString()} pts to {nextRank.emoji} {nextRank.name}</p>
                  </>
                )}
              </div>
            </div>

            {/* Your Badges */}
            <div className="mt-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 flex items-center justify-center gap-2">
                🏅 Your Badges 
                <span className="font-normal text-slate-400">
                  ({streakBadges.filter(b => checkinStreak >= b.threshold).length}/{streakBadges.length})
                </span>
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {streakBadges.map(b => {
                  const earned = checkinStreak >= b.threshold;
                  return (
                    <div key={b.id} className={`flex flex-col items-center p-2 rounded-lg transition ${earned ? 'bg-orange-400/20' : 'bg-white/5 opacity-40'}`}>
                      <span className="text-xl">{b.icon}</span>
                      <span className="text-[8px] mt-1">{b.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>

        {/* Tools For Happiness Section */}
        <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">🌱 Joy Toolkit</h2>
              <p className="text-slate-400 text-sm">Seeds of thought, sparks of joy, and breath to grow your garden</p>
            </div>

            {/* Seeds Of Thought Section */}
            <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🌱 Seeds Of Thought
              </h3>
              <button
                onClick={() => setShowQuoteBrowser(true)}
                className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 hover:from-purple-500/30 hover:to-pink-500/30 transition"
              >
                <div className="text-3xl mb-2">🌱</div>
                <div className="font-medium">Browse {wisdomQuotes.length} Seeds Of Thought</div>
                <div className="text-xs text-slate-400 mt-1">Wisdom to plant in your mind</div>
              </button>
            </div>

            {/* Sparks Of Joy Section */}
            <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                ✨ Sparks Of Joy
              </h3>
              <button
                onClick={() => setShowExerciseBrowser(true)}
                className="w-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-4 hover:from-orange-500/30 hover:to-yellow-500/30 transition"
              >
                <div className="text-3xl mb-2">🥋</div>
                <div className="font-medium">Enter Your Mental Dojo</div>
                <div className="text-xs text-slate-400 mt-1">30-second practices to spark joy & train your mind</div>
              </button>
            </div>

            {/* Breath Of Fresh Air Section */}
            <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🌬️ Breath Of Fresh Air
              </h3>
              <button
                onClick={() => setShowBreathworkBrowser(true)}
                className="w-full bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 rounded-xl p-4 hover:from-teal-500/30 hover:to-cyan-500/30 transition"
              >
                <div className="text-3xl mb-2">🌬️</div>
                <div className="font-medium">Browse {breathworkPatterns.length} Breathing Patterns</div>
                <div className="text-xs text-slate-400 mt-1">1-minute calm for body & mind</div>
              </button>
            </div>

            {/* Tools Of Thought Section */}
            <div className="bg-white/5 rounded-2xl p-5 mb-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🧠 Tools Of Thought
              </h3>
              <button
                onClick={() => setShowCBTBrowser(true)}
                className="w-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4 hover:from-blue-500/30 hover:to-indigo-500/30 transition"
              >
                <div className="text-3xl mb-2">🧠</div>
                <div className="font-medium">Browse {cbtExercises.length} Mindset Exercises</div>
                <div className="text-xs text-slate-400 mt-1">Shift your thinking, shift your world</div>
              </button>
            </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-6">
            <span>🔒</span>
            <span>All data stays on your device</span>
          </div>

          <footer className="text-center mt-4 text-slate-500 text-xs">Made with 💛 for a happier {CURRENT_YEAR}</footer>
        </>
      </div>

      {/* Modals */}
      <QuoteBrowser isOpen={showQuoteBrowser} onClose={() => setShowQuoteBrowser(false)} addPoints={addPoints} onBoost={handleToolBoost} />
      <ExerciseBrowser isOpen={showExerciseBrowser} onClose={() => setShowExerciseBrowser(false)} addPoints={addPoints} onBoost={handleToolBoost} playSound={playSound} />
      <BreathworkBrowser isOpen={showBreathworkBrowser} onClose={() => setShowBreathworkBrowser(false)} addPoints={addPoints} onBoost={handleToolBoost} playSound={playSound} />
      <CBTBrowser isOpen={showCBTBrowser} onClose={() => setShowCBTBrowser(false)} addPoints={addPoints} onBoost={handleToolBoost} playSound={playSound} />
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onClearCheckins={handleClearCheckins}
        onClearAll={handleClearAll}
        stats={{ checkins: checkins.length }}
        checkins={checkins}
        notificationSettings={notificationSettings}
        setNotificationSettings={setNotificationSettings}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />
      <ChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
      />
      <WeeklyReflection
        isOpen={showWeeklyReflection}
        onClose={() => setShowWeeklyReflection(false)}
        checkins={checkins}
      />
      <MilestoneCelebration
        isOpen={showMilestone}
        onClose={() => {
          setShowMilestone(false);
          // Show insights for key milestones
          const insightMilestones = [7, 14, 30, 60, 100];
          if (milestoneData?.streak && insightMilestones.includes(milestoneData.streak)) {
            setTimeout(() => setShowInsights(true), 300);
          }
        }}
        streak={milestoneData?.streak}
        badge={milestoneData?.badge}
        onChallenge={() => { setShowMilestone(false); setShowChallengeModal(true); }}
        addPoints={addPoints}
      />
      <HappinessInsights
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        checkins={checkins}
        streak={milestoneData?.streak || checkinStreak}
        addPoints={addPoints}
      />
      <ShareSmileCard
        isOpen={showShareSmile}
        onClose={() => setShowShareSmile(false)}
        addPoints={addPoints}
      />

      {/* Ripples Of Joy Modal */}
      {showRipplesModal && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen">
            <button
              onClick={() => setShowRipplesModal(false)}
              className="fixed top-4 right-4 z-10 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
            >
              ✕ Close
            </button>
            <TheWorldTab />
          </div>
        </div>
      )}

      <Confetti active={showConfetti} />
      <Toast
        message={toastMessage}
        emoji={toastEmoji}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
