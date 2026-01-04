import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, runTransaction, increment, set, get } from 'firebase/database';
import html2canvas from 'html2canvas';
import { useVersionCheck } from './useVersionCheck';
import UpdateNotification from './UpdateNotification';

// App Version
const APP_VERSION = '2.8.5';
const BUILD_DATE = '2026-01-04';

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
  const todayRef = ref(database, `globalStats/todayCheckins/${new Date().toISOString().split('T')[0]}`);
  runTransaction(totalRef, (current) => (current || 0) + 1);
  runTransaction(todayRef, (current) => (current || 0) + 1);
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

// Reference for global happiness sources
const globalHappinessSourcesRef = ref(database, 'globalHappinessSources');
// References for global favorites
const globalFavoriteQuotesRef = ref(database, 'globalFavorites/quotes');
const globalFavoriteExercisesRef = ref(database, 'globalFavorites/exercises');

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
  { title: "4-7-8 Breathing", subtitle: "Calms your nervous system", steps: ["Exhale completely through your mouth", "Inhale through nose for 4 counts", "Hold breath for 7 counts", "Exhale through mouth for 8 counts", "Repeat 3-4 times"], pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 } },
  { title: "Box Breathing", subtitle: "Used by Navy SEALs", steps: ["Breathe in for 4 counts", "Hold at top for 4 counts", "Breathe out for 4 counts", "Hold at bottom for 4 counts", "Repeat 4-6 times"], pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 } },
  { title: "Heart Coherence Breathing", subtitle: "Sync your heart and mind", steps: ["Place your hand on your heart", "Breathe slowly: 5 counts in, 5 counts out", "Focus attention on your heart area", "Recall a feeling of love or gratitude", "Breathe that feeling in and out", "Continue for 2-3 minutes"], pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 } },
  { title: "Progressive Muscle Relaxation", subtitle: "Release physical tension", steps: ["Sit or lie down comfortably", "Tense your toes for 5 seconds, then release", "Move up: calves, thighs, belly, chest", "Tense and release hands, arms, shoulders", "Finish with jaw and face muscles", "Notice the wave of relaxation throughout your body"], pattern: null },
  { title: "Savoring Exercise", subtitle: "Amplify positive moments", steps: ["Find something pleasant happening now", "Close other tabs in your mind", "Notice every detail - sight, sound, feeling", "Let yourself fully enjoy this moment", "Store this memory for later", "Thank yourself for pausing to notice"], pattern: null },
  { title: "Gratitude Visualization", subtitle: "Shift to abundance", steps: ["Close eyes, take 3 deep breaths", "Picture someone you love smiling", "Feel warmth in your chest", "Think of 3 things you're grateful for", "Let a gentle smile form"], pattern: null },
  { title: "Loving-Kindness Meditation", subtitle: "Buddhist practice for joy", steps: ["Place hand on heart", "Say: May I be happy, healthy, safe", "Wish the same to someone you love", "Extend to a neutral person", "Extend to someone difficult", "Finally, wish this for all beings"], pattern: null },
  { title: "Body Scan Release", subtitle: "Release hidden tension", steps: ["Start at top of head", "Notice tension in forehead, jaw", "With each exhale, let it melt", "Move down: neck, chest, belly, legs", "End at feet, feeling grounded"], pattern: null },
  { title: "Safe Place Visualization", subtitle: "Create inner sanctuary", steps: ["Close your eyes and breathe deeply", "Imagine a place where you feel completely safe", "It can be real or imaginary", "Notice the colors, sounds, temperature", "Feel the peace of this place", "Know you can return here anytime"], pattern: null },
  { title: "Mindful Minute", subtitle: "Quick reset anywhere", steps: ["Stop and close your eyes", "Take 5 slow, deep breaths", "Notice 3 things you can hear", "Notice 2 things you can feel", "Notice 1 thing you're grateful for"], pattern: null },
  { title: "Joy Recall", subtitle: "Relive your happiest moments", steps: ["Close your eyes and relax", "Remember a moment of pure joy", "Where were you? Who was there?", "Feel the emotions fully again", "Let a smile spread across your face", "Carry this feeling with you"], pattern: null },
  { title: "Smile Meditation", subtitle: "The happiness feedback loop", steps: ["Sit comfortably and close your eyes", "Gently smile — even if you don't feel it", "Notice how your face muscles feel", "Let the smile soften your eyes", "Feel warmth spreading through you", "Your body tells your mind: be happy"], pattern: null },
  { title: "GLAD Technique", subtitle: "Find four daily wins", steps: ["G — One GOOD thing today", "L — One thing you LEARNED", "A — One small ACCOMPLISHMENT", "D — One thing that DELIGHTED you", "Reflect on each one with gratitude"], pattern: null },
  { title: "Three Good Things", subtitle: "Rewire your brain for positivity", steps: ["Think of three good things from today", "They can be tiny: a warm cup of tea, a kind word", "For each one, ask: Why did this happen?", "Write them down or just reflect", "Do this daily for two weeks", "Watch your brain start noticing more good"], pattern: null },
  { title: "Acts of Kindness Practice", subtitle: "Boost happiness through giving", steps: ["Think of one small kind act you can do today", "It can be tiny: hold a door, send a text, smile", "Do it without expecting anything back", "Notice how it feels in your body", "Kindness to others is kindness to yourself"], pattern: null },
];

// Night-only exercise for hypnagogia/dream problem-solving
const nightExercise = {
  title: "Dream Insight",
  subtitle: "Let your sleeping mind solve problems",
  description: "Edison, Dalí, and Einstein used the hypnagogic state — the twilight between waking and sleep — to unlock creative breakthroughs. Your dreaming mind sees connections your waking mind misses.",
  steps: [
    "Think of a question or problem you want insight on",
    "Write it down or say it clearly in your mind",
    "Read/repeat it slowly three times",
    "Close your eyes and visualize the question as an image",
    "Take slow breaths and release any need for an answer",
    "As you drift off, stay curious but not grasping",
    "Keep a notepad nearby for morning insights",
    "Upon waking, immediately capture any thoughts"
  ],
  pattern: null,
  isNightOnly: true
};

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
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

const timeRituals = {
  morning: {
    emoji: '🌅',
    greeting: 'Good morning!',
    title: 'Morning Ritual',
    sourcePrompt: "What's energizing you this morning?",
    gratitudePrompt: "What are you grateful for as you start your day?",
    intentionPrompt: "What's one intention for today?",
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
    sourcePrompt: "What's going well today?",
    gratitudePrompt: "What's been a bright spot so far?",
    intentionPrompt: "What will make the rest of today great?",
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
    sourcePrompt: "What made today good?",
    gratitudePrompt: "What are you thankful for from today?",
    intentionPrompt: "What's one thing you're letting go of tonight?",
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
    sourcePrompt: "What's bringing you peace tonight?",
    gratitudePrompt: "What from today are you carrying into tomorrow?",
    intentionPrompt: "What thought do you want to sleep on?",
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
  emoji: '🌟',
  greeting: 'Happiness Check-in',
  title: 'Check-in',
  sourcePrompt: "What's bringing you happiness right now?",
  gratitudePrompt: "What are you grateful for?",
  intentionPrompt: null, // No intention for regular check-ins
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
const getTodayKey = () => new Date().toISOString().split('T')[0];

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

const journalPrompts = [
  "What made you smile today?",
  "What are you grateful for right now?",
  "What's one small win you had today?",
  "How are you really feeling?",
  "What would make today better?",
  "What's weighing on your mind?",
  "Describe your current mood in 3 words.",
  "What's something you're looking forward to?",
  "What do you need right now?",
  "What would you tell your past self?",
];

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

// Milestone Celebration Modal
function MilestoneCelebration({ isOpen, onClose, streak, badge, onShare, onChallenge }) {
  if (!isOpen) return null;

  const shareText = `🎉 I just hit a ${streak}-day happiness streak!\n\n${badge?.icon} ${badge?.name}\n\nTrack what makes you smile 😊\n\n${APP_URL}`;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-sm w-full p-6 border border-yellow-400/30 text-center" onClick={e => e.stopPropagation()}>
        <div className="text-6xl mb-4">{badge?.icon || '🎉'}</div>
        <h2 className="text-2xl font-bold mb-2">Amazing!</h2>
        <p className="text-yellow-400 text-lg font-semibold mb-1">{streak} Day Streak!</p>
        <p className="text-slate-400 mb-6">{badge?.name || 'Keep it going!'}</p>
        
        <div className="space-y-3">
          <button
            onClick={() => { shareContent(shareText); onShare?.(); }}
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

// Challenge a Friend Modal
function ChallengeModal({ isOpen, onClose }) {
  const [days, setDays] = useState(7);
  
  if (!isOpen) return null;

  const challengeText = `🎯 I'm challenging you to ${days} days of happiness!\n\nCan you track what makes you smile for ${days} days straight?\n\nAccept the challenge: ${APP_URL}`;

  const sendChallenge = () => {
    shareContent(challengeText, 'Challenge copied! Send it to a friend 💪');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-sm w-full p-6 border border-pink-400/30" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🎯</div>
          <h2 className="text-xl font-bold">Challenge a Friend</h2>
          <p className="text-slate-400 text-sm">Spread happiness together</p>
        </div>

        <p className="text-slate-300 text-sm mb-3 text-center">Challenge them to a streak of:</p>
        <div className="flex gap-2 justify-center mb-6">
          {[7, 14, 21, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl font-semibold transition ${days === d ? 'bg-pink-500 text-white' : 'bg-white/10 text-slate-300'}`}
            >
              {d} days
            </button>
          ))}
        </div>

        <button
          onClick={sendChallenge}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition mb-3"
        >
          💌 Send Challenge
        </button>
        <button onClick={onClose} className="w-full text-slate-400 text-sm">
          Cancel
        </button>
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

  const shareText = `📊 My Happiness Week in Review\n\n✅ ${totalCheckins} check-ins\n📅 ${daysActive} days active\n\nTop sources:\n${topSources.map(([s, c], i) => `${['🥇', '🥈', '🥉'][i]} ${sourceLabels[s] || s}`).join('\n')}\n\nTrack your happiness: ${APP_URL}`;

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

// Dynamic - always uses current year
const CURRENT_YEAR = new Date().getFullYear();

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://stillhappyvibing.vercel.app';

const shareContent = async (text, fallbackMessage = 'Copied to clipboard! 📋') => {
  if (navigator.share) {
    try { 
      await navigator.share({ text }); 
      return true;
    } catch { return false; }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      alert(fallbackMessage);
      return true;
    } catch { return false; }
  }
};

const shareGratitude = (gratitudeText) => {
  const text = `💛 A thank you for you:\n\n"${gratitudeText}"\n\n— Sent with gratitude ✨\n${APP_URL}`;
  return shareContent(text);
};

const shareQuote = (quote) => {
  const text = `📖 A moment of wisdom:\n\n"${quote.text}"\n— ${quote.author}\n\n${APP_URL}`;
  return shareContent(text);
};

const shareExercise = (exercise) => {
  let text = `🧘 Try this when you need calm:\n\n${exercise.title}\n${exercise.subtitle}\n\n`;
  if (exercise.pattern) {
    text += `Inhale ${exercise.pattern.inhale}s`;
    if (exercise.pattern.hold1) text += ` → Hold ${exercise.pattern.hold1}s`;
    text += ` → Exhale ${exercise.pattern.exhale}s`;
    if (exercise.pattern.hold2) text += ` → Hold ${exercise.pattern.hold2}s`;
    text += '\n\n';
  }
  text += APP_URL;
  return shareContent(text);
};

// Global Counter Component
function GlobalCounter() {
  const [stats, setStats] = useState({ activeStreaks: 0, totalCheckins: 0, todayCheckins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(globalCounterRef, (snapshot) => {
      const data = snapshot.val() || {};
      const today = new Date().toISOString().split('T')[0];
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

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mx-auto"></div>
      </div>
    );
  }

  const formatNumber = (num) => num.toLocaleString();

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-lg">🌍</span>
        <span className="text-purple-300 font-medium">
          <span className="text-white font-bold">{formatNumber(stats.activeStreaks)}</span> people on a happiness streak
        </span>
      </div>
      <div className="flex justify-center gap-4 text-sm text-slate-400">
        <span>✨ {formatNumber(stats.todayCheckins)} check-ins today</span>
        <span>💫 {formatNumber(stats.totalCheckins)} all-time</span>
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
  growth: '📚 Growth', comfort: '🛏️ Comfort', reflection: '💭 Reflection',
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

// Share Card Modal - generates shareable image
function ShareCardModal({ isOpen, onClose, streak, topSources, quote }) {
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
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'stillhappy.png', { type: 'image/png' })] })) {
          try {
            await navigator.share({
              files: [new File([blob], 'stillhappy.png', { type: 'image/png' })],
              title: 'My Happiness Journey',
              text: `I'm on a ${streak} day happiness streak! 🔥 stillhappy.app`
            });
          } catch (e) {
            // User cancelled or error
          }
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `stillhappy-${streak}days.png`;
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
          <h2 className="text-lg font-bold">📸 Share Your Journey</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* The Card to be captured */}
        <div 
          ref={cardRef} 
          className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-5 mb-4"
        >
          <div className="text-center text-white">
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">My Happiness Streak</p>
            <p className="text-5xl font-bold mb-1">{streak} 🔥</p>
            <p className="text-sm opacity-90 mb-4">{streak === 1 ? 'day' : 'days'} of joy</p>
            
            {topSources.length > 0 && (
              <div className="bg-white/20 rounded-xl p-3 mb-3">
                <p className="text-xs uppercase tracking-wider opacity-80 mb-2">What makes me smile</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {topSources.slice(0, 3).map(([src]) => (
                    <span key={src} className="text-sm bg-white/20 px-2 py-1 rounded-full">
                      {sourceLabels[src] || src}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {quote && (
              <p className="text-xs italic opacity-80 mb-2">"{quote.text.slice(0, 60)}..."</p>
            )}
            
            <p className="text-xs font-bold opacity-90">stillhappy.app ✨</p>
          </div>
        </div>

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
              title: type === 'quote' ? 'Wisdom to Share' : type === 'exercise' ? 'Mindfulness Exercise' : 'Gratitude',
              text: `Shared from stillhappy.app ✨`
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
              <p className="text-4xl mb-4">📖</p>
              <p className="text-lg italic mb-4 leading-relaxed">"{data.text}"</p>
              <p className="text-sm font-semibold mb-1">— {data.author}</p>
              <p className="text-xs opacity-80 mb-4">{data.tradition}</p>
              <p className="text-xs font-bold opacity-90">stillhappy.app ✨</p>
            </div>
          </div>
        )}

        {/* Exercise Card */}
        {type === 'exercise' && data && (
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-teal-600 via-green-500 to-emerald-500 rounded-2xl p-6 mb-4"
          >
            <div className="text-center text-white">
              <p className="text-4xl mb-3">{data.isNightOnly ? '🌙' : '🧘'}</p>
              <p className="text-xl font-bold mb-1">{data.title}</p>
              <p className="text-sm opacity-90 mb-4">{data.subtitle}</p>

              <div className="bg-white/20 rounded-xl p-3 mb-3 text-left">
                <ul className={`space-y-1.5 ${data.steps.length > 6 ? 'text-xs' : 'text-sm'}`}>
                  {data.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="opacity-70 flex-shrink-0">{i + 1}.</span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs font-bold opacity-90">stillhappy.app ✨</p>
            </div>
          </div>
        )}

        {/* Gratitude Card */}
        {type === 'gratitude' && data && (
          <div
            ref={cardRef}
            className="bg-gradient-to-br from-amber-600 via-orange-500 to-pink-500 rounded-2xl p-6 mb-4"
          >
            <div className="text-center text-white">
              <p className="text-4xl mb-3">🙏</p>
              <p className="text-xs uppercase tracking-wider opacity-80 mb-3">Grateful for</p>

              {data.sources && data.sources.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mb-4">
                  {data.sources.map(src => {
                    const labels = {
                      work: '💼 Work', relationship: '💕 Loved ones', health: '🏃 Health',
                      peace: '😌 Peace', nature: '🌿 Nature', achievement: '🎯 Achievement',
                      fun: '🎉 Fun', rest: '😴 Rest'
                    };
                    return (
                      <span key={src} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {labels[src] || src}
                      </span>
                    );
                  })}
                </div>
              )}

              {data.gratitude && (
                <div className="bg-white/20 rounded-xl p-3 mb-3">
                  <p className="text-sm italic leading-relaxed">{data.gratitude}</p>
                </div>
              )}

              <p className="text-xs opacity-80 mb-3">{new Date(data.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-xs font-bold opacity-90">stillhappy.app ✨</p>
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

              <p className="text-xs font-bold opacity-90 mt-4">Join us at stillhappy.app ✨</p>
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
function QuoteBrowser({ isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('happinessFavoriteQuotes') || '[]');
    } catch {
      return [];
    }
  });

  const currentQuote = wisdomQuotes[currentIndex];
  const isFavorite = favorites.includes(currentIndex);

  const toggleFavorite = () => {
    const newFavorites = isFavorite
      ? favorites.filter(i => i !== currentIndex)
      : [...favorites, currentIndex];
    setFavorites(newFavorites);
    localStorage.setItem('happinessFavoriteQuotes', JSON.stringify(newFavorites));

    // Update global favorites counter
    if (isFavorite) {
      decrementQuoteFavorite(currentIndex);
    } else {
      incrementQuoteFavorite(currentIndex);
    }
  };

  const nextQuote = () => {
    setCurrentIndex((currentIndex + 1) % wisdomQuotes.length);
  };

  const prevQuote = () => {
    setCurrentIndex((currentIndex - 1 + wisdomQuotes.length) % wisdomQuotes.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-purple-400/20" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">📖 Browse Wisdom</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-4 text-center">
          <p className="text-xs text-slate-400 mb-4">{currentIndex + 1} of {wisdomQuotes.length}</p>

          <div className="border-l-4 border-purple-400 bg-white/5 p-5 rounded-r-xl mb-4 min-h-[200px] flex flex-col justify-center">
            <p className="text-lg italic mb-3 leading-relaxed">"{currentQuote.text}"</p>
            <p className="text-purple-400 font-medium">— {currentQuote.author}</p>
            <p className="text-slate-400 text-sm">{currentQuote.tradition}</p>
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={prevQuote}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition"
            >
              ← Previous
            </button>
            <button
              onClick={toggleFavorite}
              className={`px-4 py-3 rounded-xl transition ${isFavorite ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-400'}`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            <button
              onClick={nextQuote}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold transition"
            >
              Next →
            </button>
          </div>

          <button
            onClick={() => shareQuote(currentQuote)}
            className="w-full py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm hover:bg-purple-500/30 transition"
          >
            📤 Share this quote
          </button>
        </div>
      </div>
    </div>
  );
}

// Exercise Browser/Carousel Component
function ExerciseBrowser({ isOpen, onClose }) {
  const allExercises = [...exercises, nightExercise];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('happinessFavoriteExercises') || '[]');
    } catch {
      return [];
    }
  });

  const currentExercise = allExercises[currentIndex];
  const isFavorite = favorites.includes(currentIndex);

  const toggleFavorite = () => {
    const newFavorites = isFavorite
      ? favorites.filter(i => i !== currentIndex)
      : [...favorites, currentIndex];
    setFavorites(newFavorites);
    localStorage.setItem('happinessFavoriteExercises', JSON.stringify(newFavorites));

    // Update global favorites counter
    if (isFavorite) {
      decrementExerciseFavorite(currentIndex);
    } else {
      incrementExerciseFavorite(currentIndex);
    }
  };

  const nextExercise = () => {
    setCurrentIndex((currentIndex + 1) % allExercises.length);
  };

  const prevExercise = () => {
    setCurrentIndex((currentIndex - 1 + allExercises.length) % allExercises.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-green-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">🧘 Browse Exercises</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-4 text-center">{currentIndex + 1} of {allExercises.length}</p>

          <div className={`${currentExercise.isNightOnly ? 'bg-indigo-400/10 border-indigo-400/30' : 'bg-green-400/10 border-green-400/30'} border rounded-xl p-4 mb-4`}>
            <h3 className={`${currentExercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'} font-semibold text-lg mb-1`}>
              {currentExercise.isNightOnly ? '🌙' : '🧘'} {currentExercise.title}
            </h3>
            <p className="text-slate-400 text-sm mb-3">{currentExercise.subtitle}</p>
            {currentExercise.description && (
              <p className="text-slate-300 text-sm mb-3 italic">{currentExercise.description}</p>
            )}
            {currentExercise.pattern && <BreathingGuide pattern={currentExercise.pattern} />}
            <ul className="space-y-1.5 text-sm mt-3">
              {currentExercise.steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className={currentExercise.isNightOnly ? 'text-indigo-400' : 'text-green-400'}>{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={prevExercise}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition"
            >
              ← Previous
            </button>
            <button
              onClick={toggleFavorite}
              className={`px-4 py-3 rounded-xl transition ${isFavorite ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-slate-400'}`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
            <button
              onClick={nextExercise}
              className="flex-1 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-slate-900 rounded-xl font-semibold transition"
            >
              Next →
            </button>
          </div>

          <button
            onClick={() => shareExercise(currentExercise)}
            className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/30 transition"
          >
            📤 Share this exercise
          </button>
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

// The World Tab Component - Global happiness data only
function TheWorldTab() {
  const [globalSources, setGlobalSources] = useState({});
  const [globalFavoriteQuotes, setGlobalFavoriteQuotes] = useState({});
  const [globalFavoriteExercises, setGlobalFavoriteExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWorldShare, setShowWorldShare] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(globalHappinessSourcesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setGlobalSources(data);
      setLoading(false);
    }, (error) => {
      console.log('Firebase read error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch global favorite quotes
  useEffect(() => {
    const unsubscribe = onValue(globalFavoriteQuotesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setGlobalFavoriteQuotes(data);
    }, (error) => {
      console.log('Firebase read error (quotes):', error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch global favorite exercises
  useEffect(() => {
    const unsubscribe = onValue(globalFavoriteExercisesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setGlobalFavoriteExercises(data);
    }, (error) => {
      console.log('Firebase read error (exercises):', error);
    });

    return () => unsubscribe();
  }, []);

  const formatNumber = (num) => num.toLocaleString();

  // Sort global sources by count
  const sortedGlobal = Object.entries(globalSources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxGlobal = sortedGlobal.length > 0 ? sortedGlobal[0][1] : 1;
  const totalSmiles = Object.values(globalSources).reduce((a, b) => a + b, 0);

  // Sort all favorite quotes by count (most favorited first)
  const topQuotes = Object.entries(globalFavoriteQuotes)
    .sort((a, b) => b[1] - a[1])
    .map(([index, count]) => ({
      index: parseInt(index),
      count,
      quote: wisdomQuotes[parseInt(index)]
    }))
    .filter(item => item.quote); // Filter out any invalid indices

  // Sort all favorite exercises by count (most favorited first)
  const allExercises = [...exercises, nightExercise];
  const topExercises = Object.entries(globalFavoriteExercises)
    .sort((a, b) => b[1] - a[1])
    .map(([index, count]) => ({
      index: parseInt(index),
      count,
      exercise: allExercises[parseInt(index)]
    }))
    .filter(item => item.exercise); // Filter out any invalid indices

  // Calculate earned global milestones
  const earnedMilestones = globalMilestones.filter(m => totalSmiles >= m.threshold);
  const nextMilestone = globalMilestones.find(m => totalSmiles < m.threshold);

  return (
    <>
      {/* Global Stats Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur rounded-2xl p-5 mb-4 border border-purple-500/20 text-center">
        <div className="text-4xl mb-2">🌍</div>
        <h2 className="text-xl font-bold mb-1">The World is Smiling</h2>
        <p className="text-3xl font-bold text-purple-300">{formatNumber(totalSmiles)}</p>
        <p className="text-sm text-slate-400 mb-3">smiles shared globally</p>

        <button
          onClick={() => setShowWorldShare(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-300 text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition flex items-center justify-center gap-2 mx-auto"
        >
          📸 Share the joy
        </button>

        {nextMilestone && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-slate-400">
              {formatNumber(nextMilestone.threshold - totalSmiles)} more to reach {nextMilestone.icon} {nextMilestone.label}!
            </p>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all"
                style={{ width: `${(totalSmiles / nextMilestone.threshold) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Global Happiness Sources */}
      <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-4 border border-white/10">
        <h3 className="font-semibold mb-4 flex items-center gap-2">✨ What's Making the World Happy</h3>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-6 bg-white/10 rounded"></div>
            ))}
          </div>
        ) : sortedGlobal.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-3xl mb-2">🌱</p>
            <p>Be the first to share what makes you happy!</p>
            <p className="text-sm">Your check-in will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGlobal.map(([source, count], index) => (
              <div key={source} className="flex items-center gap-2">
                <span className="text-lg w-6">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}</span>
                <span className="text-sm w-28 truncate">{sourceLabels[source] || source}</span>
                <div className="flex-1 h-5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all"
                    style={{ width: `${(count / maxGlobal) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-purple-300 w-14 text-right">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Quotes - Carousel */}
      {topQuotes.length > 0 && (
        <WorldQuoteCarousel topQuotes={topQuotes} />
      )}

      {/* Favorite Exercises - Carousel */}
      {topExercises.length > 0 && (
        <WorldExerciseCarousel topExercises={topExercises} />
      )}

      {/* Global Milestones */}
      <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
        <h3 className="font-semibold mb-3 flex items-center justify-center gap-2 text-sm">
          🏆 Global Milestones
          <span className="font-normal text-slate-400">
            ({earnedMilestones.length}/{globalMilestones.length})
          </span>
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {globalMilestones.map(m => {
            const earned = totalSmiles >= m.threshold;
            return (
              <div key={m.threshold} className={`flex flex-col items-center p-2 rounded-lg transition ${earned ? 'bg-purple-400/20' : 'bg-white/5 opacity-40'}`}>
                <span className="text-xl">{m.icon}</span>
                <span className="text-[8px] mt-1">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Share World Stats Modal */}
      <ShareImageCard
        isOpen={showWorldShare}
        onClose={() => setShowWorldShare(false)}
        type="world"
        data={{
          totalSmiles,
          topSources: sortedGlobal.slice(0, 3),
          earnedMilestones: earnedMilestones.length,
          totalMilestones: globalMilestones.length
        }}
      />
    </>
  );
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getDayKey = (date) => new Date(date).toISOString().split('T')[0];

// Breathing Guide Component
function BreathingGuide({ pattern }) {
  const [phase, setPhase] = useState('inhale');
  const [count, setCount] = useState(pattern?.inhale || 4);
  
  useEffect(() => {
    if (!pattern) return;
    const phases = ['inhale', 'hold1', 'exhale', 'hold2'].filter(p => pattern[p] > 0);
    let idx = 0, cnt = pattern[phases[0]];
    const interval = setInterval(() => {
      cnt--;
      if (cnt <= 0) {
        idx = (idx + 1) % phases.length;
        cnt = pattern[phases[idx]];
        setPhase(phases[idx]);
      }
      setCount(cnt);
    }, 1000);
    return () => clearInterval(interval);
  }, [pattern]);

  const labels = { inhale: 'Breathe In', hold1: 'Hold', exhale: 'Breathe Out', hold2: 'Hold' };
  const colors = { inhale: 'bg-green-500/30 scale-110', exhale: 'bg-blue-500/30 scale-90', hold1: 'bg-purple-500/30', hold2: 'bg-purple-500/30' };

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

// Check-in Modal Component - Gratitude & Happiness Source Tracker
function CheckinModal({ isOpen, onClose, onSave }) {
  const [step, setStep] = useState('source');
  const [sources, setSources] = useState([]);
  const [gratitude, setGratitude] = useState('');
  const [intention, setIntention] = useState('');

  // Get config based on time and whether ritual was done
  const [checkinConfig] = useState(() => getCheckinConfig());
  const { ritual, isRitual, timeOfDay } = checkinConfig;

  // Carousel for quotes
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * wisdomQuotes.length));
  const quote = wisdomQuotes[quoteIndex];

  const nextQuote = () => {
    setQuoteIndex((quoteIndex + 1) % wisdomQuotes.length);
  };

  const prevQuote = () => {
    setQuoteIndex((quoteIndex - 1 + wisdomQuotes.length) % wisdomQuotes.length);
  };

  // Carousel for exercises
  const allExercises = [...exercises, nightExercise];
  const [exerciseIndex, setExerciseIndex] = useState(() => {
    if (isRitual && timeOfDay === 'night') {
      return exercises.length; // nightExercise is last in allExercises
    }
    return Math.floor(Math.random() * exercises.length); // Random from regular exercises
  });
  const exercise = allExercises[exerciseIndex];

  const nextExercise = () => {
    setExerciseIndex((exerciseIndex + 1) % allExercises.length);
  };

  const prevExercise = () => {
    setExerciseIndex((exerciseIndex - 1 + allExercises.length) % allExercises.length);
  };

  // Share modal states
  const [showQuoteShare, setShowQuoteShare] = useState(false);
  const [showExerciseShare, setShowExerciseShare] = useState(false);

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

  const isQuoteFavorite = favoriteQuotes.includes(quoteIndex);
  const isExerciseFavorite = favoriteExercises.includes(exerciseIndex);

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
  };

  const selectedSources = ritual.sources.filter(s => sources.includes(s.id));

  const toggleSource = (id) => {
    setSources(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id) 
        : [...prev, id]
    );
  };

  const handleSave = () => {
    // Mark ritual as done if this was a ritual check-in
    if (isRitual && timeOfDay !== 'afternoon') {
      markRitualDone(timeOfDay);
    }
    
    onSave({ sources, gratitude, intention, quote: quote.author, timeOfDay, isRitual });
    setSources([]);
    setGratitude('');
    setIntention('');
    setStep('source');
  };

  const handleSkip = () => {
    // Mark ritual as done even if skipped
    if (isRitual && timeOfDay !== 'afternoon') {
      markRitualDone(timeOfDay);
    }
    
    onSave({ sources: [], gratitude: '', intention: '', quote: quote.author, timeOfDay, isRitual });
    setSources([]);
    setGratitude('');
    setIntention('');
    setStep('source');
  };

  if (!isOpen) return null;

  // Determine which steps to show (no gratitude step)
  const steps = ['source', 'wisdom', 'exercise'];

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-green-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">{ritual.emoji}</div>
          <h2 className="text-xl font-bold">{ritual.greeting}</h2>
          <p className="text-slate-400 text-sm">
            {isRitual ? ritual.title : 'Check-in'}
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
              onClick={() => setStep('wisdom')}
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl"
            >
              Continue →
            </button>
          </>
        )}

        {step === 'wisdom' && (
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
                onClick={() => shareQuote(quote)}
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
              <button onClick={() => setStep('source')} className="flex-1 bg-white/10 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep('exercise')} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
            </div>
          </>
        )}

        {step === 'exercise' && (
          <>
            <p className="text-center text-xs text-slate-400 mb-3">{exerciseIndex + 1} of {allExercises.length}</p>
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
                onClick={() => shareExercise(exercise)}
                className="flex-1 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm flex items-center justify-center gap-2 hover:bg-blue-500/30 transition"
              >
                📤 Share Text
              </button>
              <button
                onClick={() => setShowExerciseShare(true)}
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
        data={exercise}
      />
    </div>
  );
}

// Journal View Modal with delete functionality
function JournalModal({ isOpen, onClose, checkins, onDeleteEntry, onClearAll }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [shareEntry, setShareEntry] = useState(null);

  const sorted = [...checkins].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const sourceLabels = {
    work: '💼 Work',
    relationship: '💕 Loved ones',
    health: '🏃 Health',
    peace: '😌 Inner peace',
    nature: '🌿 Nature',
    achievement: '🎯 Achievement',
    fun: '🎉 Fun',
    rest: '😴 Good rest',
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-purple-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">🙏 Gratitude Journal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-3xl mb-2">🙏</p>
            <p>No entries yet</p>
            <p className="text-sm">Check in to start your gratitude journal!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {sorted.map((entry) => {
                // Handle both old (source) and new (sources) format
                const sourcesArray = entry.sources || (entry.source ? [entry.source] : []);
                return (
                  <div key={entry.id} className="bg-white/5 rounded-xl p-4 relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setShareEntry(entry)}
                        className="text-slate-500 hover:text-pink-400 text-sm"
                        title="Share as image"
                      >
                        📸
                      </button>
                      <button
                        onClick={() => setConfirmDelete(entry.id)}
                        className="text-slate-500 hover:text-red-400 text-sm"
                        title="Delete entry"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {sourcesArray.length > 0 ? (
                          sourcesArray.map(src => (
                            <span key={src} className="text-sm bg-green-400/20 text-green-400 px-2 py-1 rounded-full">
                              {sourceLabels[src] || src}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">😊 Happy moment</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(entry.timestamp)}</span>
                    </div>
                    {entry.gratitude && (
                      <p className="text-sm text-slate-300 leading-relaxed">{entry.gratitude}</p>
                    )}
                    {/* Support old journal field too */}
                    {entry.journal && !entry.gratitude && (
                      <p className="text-sm text-slate-300 leading-relaxed">{entry.journal}</p>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => setConfirmClearAll(true)}
              className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition"
            >
              🗑️ Clear All Entries
            </button>
          </>
        )}
        
        <div className="mt-6 p-3 bg-white/5 rounded-xl">
          <p className="text-xs text-slate-400 flex items-start gap-2">
            <span>🔒</span>
            <span>Your journal is stored locally on your device only. No data is sent to any server.</span>
          </p>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => onDeleteEntry(confirmDelete)}
        title="Delete Entry?"
        message="This entry will be permanently deleted."
        confirmText="Delete"
        danger={true}
      />

      <ConfirmDialog
        isOpen={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={onClearAll}
        title="Clear All Entries?"
        message="All your gratitude entries will be permanently deleted."
        confirmText="Clear All"
        danger={true}
      />

      {/* Share Entry Modal */}
      <ShareImageCard
        isOpen={shareEntry !== null}
        onClose={() => setShareEntry(null)}
        type="gratitude"
        data={shareEntry}
      />
    </div>
  );
}

// Settings Modal
function SettingsModal({ isOpen, onClose, onClearCheckins, onClearAll, stats, checkins, onImportData }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [notificationEnabled, setNotificationEnabled] = useState(() => {
    return localStorage.getItem(`happinessNotification${CURRENT_YEAR}`) === 'true';
  });
  const [notificationTime, setNotificationTime] = useState(() => {
    return localStorage.getItem(`happinessNotificationTime${CURRENT_YEAR}`) || '09:00';
  });
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
      setNotificationEnabled(true);
      localStorage.setItem(`happinessNotification${CURRENT_YEAR}`, 'true');
      scheduleNotification(notificationTime);
      
      // Show test notification
      new Notification('Happiness Tracker 🌟', {
        body: 'Notifications enabled! We\'ll remind you to check in.',
        icon: '/pwa-512x512.svg'
      });
    }
  };

  const scheduleNotification = (time) => {
    localStorage.setItem(`happinessNotificationTime${CURRENT_YEAR}`, time);
  };

  const toggleNotification = () => {
    if (!notificationEnabled) {
      requestNotificationPermission();
    } else {
      setNotificationEnabled(false);
      localStorage.setItem(`happinessNotification${CURRENT_YEAR}`, 'false');
    }
  };

  const handleTimeChange = (e) => {
    setNotificationTime(e.target.value);
    scheduleNotification(e.target.value);
  };

  const handleExportData = () => {
    const data = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      checkins: checkins
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stillhappy-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.checkins && Array.isArray(data.checkins)) {
          onImportData(data.checkins);
          alert(`✅ Imported ${data.checkins.length} entries!`);
        } else {
          alert('❌ Invalid backup file format');
        }
      } catch {
        alert('❌ Could not read backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };
  
  if (!isOpen) return null;

  const actions = [
    { id: 'checkins', label: 'Clear Check-ins & Journal', desc: `${stats.checkins} entries`, onConfirm: onClearCheckins },
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
          <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">🔔 Daily Reminder</h3>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-300">Enable notifications</span>
            <button
              onClick={toggleNotification}
              className={`w-12 h-6 rounded-full transition-colors ${notificationEnabled ? 'bg-green-500' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${notificationEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          
          {notificationEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Reminder time</span>
              <input
                type="time"
                value={notificationTime}
                onChange={handleTimeChange}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white"
              />
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

        <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">🔒 Your Privacy</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• Journal & personal data stored locally only</li>
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
              const shareText = `✨ I'm tracking my happiness in ${CURRENT_YEAR} with Still Happy!\n\nTrack what makes you smile 😊\n\n🌍 See what's making the world happy\n🔥 Build your daily streak\n🙏 Practice gratitude daily\n\nTry it free: ${APP_URL}`;
              shareContent(shareText, 'Check out Still Happy - shared to clipboard!');
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition"
          >
            💌 Share Still Happy
          </button>
        </div>

        <h3 className="font-semibold mb-3 text-slate-400 text-sm uppercase tracking-wider">Data Management</h3>
        
        {/* Backup & Restore */}
        <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-4 mb-4">
          <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">💾 Backup & Restore</h4>
          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="flex-1 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/30 transition"
            >
              📥 Export Data
            </button>
            <label className="flex-1 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/30 transition text-center cursor-pointer">
              📤 Import
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-slate-400 mt-2">Download your data or restore from a backup</p>
        </div>

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
          <p className="text-xs text-slate-500">Happiness Tracker v{APP_VERSION}</p>
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
  
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showWeeklyReflection, setShowWeeklyReflection] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneData, setMilestoneData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [activeTab, setActiveTab] = useState('timer');
  const [showReminder, setShowReminder] = useState(false);
  const [showQuoteBrowser, setShowQuoteBrowser] = useState(false);
  const [showExerciseBrowser, setShowExerciseBrowser] = useState(false);

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

  // Track active users globally (only once per session)
  useEffect(() => {
    const sessionKey = `happinessSessionTracked${CURRENT_YEAR}`;
    const alreadyTracked = sessionStorage.getItem(sessionKey);
    
    if (!alreadyTracked) {
      incrementActiveStreaks();
      sessionStorage.setItem(sessionKey, 'true');
    }
    
    // Decrement when user leaves
    const handleUnload = () => {
      decrementActiveStreaks();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Handle app shortcuts (URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'checkin') {
      setShowCheckinModal(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (action === 'journal') {
      setShowJournalModal(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Check for notification reminder
  useEffect(() => {
    const checkReminder = () => {
      const enabled = localStorage.getItem(`happinessNotification${CURRENT_YEAR}`) === 'true';
      const reminderTime = localStorage.getItem(`happinessNotificationTime${CURRENT_YEAR}`) || '09:00';
      const lastReminder = localStorage.getItem(`happinessLastReminder${CURRENT_YEAR}`);
      
      if (!enabled) return;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const [hours, minutes] = reminderTime.split(':').map(Number);
      
      // Check if it's past reminder time and we haven't shown reminder today
      if (now.getHours() >= hours && now.getMinutes() >= minutes && lastReminder !== today) {
        // Check if user already checked in today
        const todayCheckins = checkins.filter(c => 
          new Date(c.timestamp).toISOString().split('T')[0] === today
        ).length;
        
        if (todayCheckins === 0) {
          // Show browser notification if permitted
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Happiness Check-in 🌟', {
              body: 'Take a moment to reflect on what\'s bringing you joy today!',
              icon: '/pwa-512x512.svg',
              tag: 'happiness-reminder'
            });
          }
          setShowReminder(true);
        }
        localStorage.setItem(`happinessLastReminder${CURRENT_YEAR}`, today);
      }
    };
    
    checkReminder();
    const interval = setInterval(checkReminder, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkins]);

  // Save checkins to localStorage
  useEffect(() => {
    localStorage.setItem(`happinessCheckins${CURRENT_YEAR}`, JSON.stringify(checkins));
  }, [checkins]);

  const handleCheckinSave = ({ sources, gratitude, quote }) => {
    const checkin = { 
      id: Date.now(), 
      sources: sources || [],
      gratitude,
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
    setShowCheckinModal(false);
    
    // Check for milestone celebration
    if (milestoneThresholds.includes(newStreak) && !celebratedMilestones.includes(newStreak)) {
      const badge = streakBadges.find(b => b.threshold === newStreak);
      setMilestoneData({ streak: newStreak, badge });
      setShowConfetti(true);
      setTimeout(() => setShowMilestone(true), 500);
      setTimeout(() => setShowConfetti(false), 4000);
      setCelebratedMilestones(prev => [...prev, newStreak]);
    }
    
    // Increment global counters
    incrementCheckins();
    // Increment each selected source
    (sources || []).forEach(source => {
      incrementHappinessSource(source);
    });
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

  const handleImportData = (importedCheckins) => {
    // Merge imported data with existing, avoiding duplicates by id
    const existingIds = new Set(checkins.map(c => c.id));
    const newCheckins = importedCheckins.filter(c => !existingIds.has(c.id));
    setCheckins(prev => [...prev, ...newCheckins]);
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">✨ Happiness Tracker ✨</h1>
            <button onClick={() => setShowSettingsModal(true)} className="text-slate-400 hover:text-white text-xl">⚙️</button>
          </div>
          <p className="text-slate-400 text-xs mb-2">Track what makes you smile</p>
          <span className="inline-block px-4 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold rounded-full text-sm">🎉 {CURRENT_YEAR} 🎉</span>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4">
          {[
            { id: 'timer', label: '😊 Home' },
            { id: 'world', label: '🌍 The World' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timer Tab */}
        {activeTab === 'timer' && (
          <>
            {/* Global Counter */}
            <div className="mb-4">
              <GlobalCounter />
            </div>

            {/* Reminder Banner */}
            {showReminder && (
              <div className="bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border border-yellow-400/30 rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔔</span>
                  <div>
                    <p className="font-medium text-yellow-400">Time for a check-in!</p>
                    <p className="text-xs text-slate-300">What's bringing you happiness today?</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setShowReminder(false); setShowCheckinModal(true); }}
                    className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    Check in
                  </button>
                  <button 
                    onClick={() => setShowReminder(false)}
                    className="text-slate-400 hover:text-white px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-white/5 backdrop-blur rounded-2xl p-5 mb-4 border border-white/10">
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
              
              {/* What Makes YOU Happy - Visual Reminder */}
              {checkins.length > 0 && (
                <div className="mb-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-400 uppercase tracking-wider text-center mb-3">What Makes You Happy</p>
                  <div className="space-y-2">
                    {(() => {
                      const counts = checkins.reduce((acc, c) => {
                        // Handle both old (source) and new (sources) format
                        const sourcesArray = c.sources || (c.source ? [c.source] : []);
                        sourcesArray.forEach(source => {
                          if (source) acc[source] = (acc[source] || 0) + 1;
                        });
                        return acc;
                      }, {});
                      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
                      const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
                      
                      return sorted.map(([source, count]) => (
                        <div key={source} className="flex items-center gap-2">
                          <span className="text-sm w-28 truncate">{sourceLabels[source] || source}</span>
                          <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-5 text-right">{count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowCheckinModal(true)}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 px-4 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg shadow-green-500/20"
              >
                ✓ Check In
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                onClick={() => setShowChallengeModal(true)}
                className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-3 flex flex-col items-center gap-1 hover:from-pink-500/30 hover:to-purple-500/30 transition"
              >
                <span className="text-xl">🎯</span>
                <span className="text-xs font-medium">Challenge A Friend</span>
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowWeeklyReflection(true)}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1 hover:bg-white/10 transition"
              >
                <span className="text-xl">📊</span>
                <span className="text-xs font-medium">Share Weekly Update</span>
              </button>
              <button
                onClick={() => setShowShareCard(true)}
                className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-3 flex flex-col items-center gap-1 hover:from-purple-500/30 hover:to-blue-500/30 transition"
              >
                <span className="text-xl">📸</span>
                <span className="text-xs font-medium">Share A Smile</span>
              </button>
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
        )}

        {/* The World Tab */}
        {activeTab === 'world' && (
          <TheWorldTab />
        )}

        {/* Micro-Moment Footer */}
        <div className="mt-6">
          <MicroMoment />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-3">
          <span>🔒</span>
          <span>All data stays on your device</span>
        </div>

        <footer className="text-center mt-4 text-slate-500 text-xs">Made with 💛 for a happier {CURRENT_YEAR}</footer>
      </div>

      {/* Modals */}
      <CheckinModal isOpen={showCheckinModal} onClose={() => setShowCheckinModal(false)} onSave={handleCheckinSave} />
      <QuoteBrowser isOpen={showQuoteBrowser} onClose={() => setShowQuoteBrowser(false)} />
      <ExerciseBrowser isOpen={showExerciseBrowser} onClose={() => setShowExerciseBrowser(false)} />
      <JournalModal 
        isOpen={showJournalModal} 
        onClose={() => setShowJournalModal(false)} 
        checkins={checkins} 
        onDeleteEntry={handleDeleteCheckin}
        onClearAll={handleClearCheckins}
      />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        onClearCheckins={handleClearCheckins}
        onClearAll={handleClearAll}
        stats={{ checkins: checkins.length }}
        checkins={checkins}
        onImportData={handleImportData}
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
        onClose={() => setShowMilestone(false)}
        streak={milestoneData?.streak}
        badge={milestoneData?.badge}
        onChallenge={() => { setShowMilestone(false); setShowChallengeModal(true); }}
      />
      <ShareCardModal
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        streak={checkinStreak}
        topSources={(() => {
          const counts = checkins.reduce((acc, c) => {
            const sourcesArray = c.sources || (c.source ? [c.source] : []);
            sourcesArray.forEach(src => {
              if (src) acc[src] = (acc[src] || 0) + 1;
            });
            return acc;
          }, {});
          return Object.entries(counts).sort((a, b) => b[1] - a[1]);
        })()}
        quote={wisdomQuotes[0]}
      />
      <Confetti active={showConfetti} />

      {/* Floating Action Button - Check In */}
      <button
        onClick={() => setShowCheckinModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-transform z-40"
        aria-label="Check in"
      >
        ✓
      </button>
    </div>
  );
}
