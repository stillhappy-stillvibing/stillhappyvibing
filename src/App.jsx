import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, runTransaction, increment, set, get } from 'firebase/database';

// App Version
const APP_VERSION = '2.1.0';
const BUILD_DATE = '2026-01-03 4:30 AM';

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

// Reference for global happiness sources
const globalHappinessSourcesRef = ref(database, 'globalHappinessSources');

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
];

const exercises = [
  { title: "4-7-8 Breathing", subtitle: "Calms your nervous system", steps: ["Exhale completely through your mouth", "Inhale through nose for 4 counts", "Hold breath for 7 counts", "Exhale through mouth for 8 counts", "Repeat 3-4 times"], pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 } },
  { title: "Box Breathing", subtitle: "Used by Navy SEALs", steps: ["Breathe in for 4 counts", "Hold at top for 4 counts", "Breathe out for 4 counts", "Hold at bottom for 4 counts", "Repeat 4-6 times"], pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 } },
  { title: "Heart Coherence Breathing", subtitle: "Sync your heart and mind", steps: ["Place your hand on your heart", "Breathe slowly: 5 counts in, 5 counts out", "Focus attention on your heart area", "Recall a feeling of love or gratitude", "Breathe that feeling in and out", "Continue for 2-3 minutes"], pattern: { inhale: 5, hold1: 0, exhale: 5, hold2: 0 } },
  { title: "Gratitude Visualization", subtitle: "Shift to abundance", steps: ["Close eyes, take 3 deep breaths", "Picture someone you love smiling", "Feel warmth in your chest", "Think of 3 things you're grateful for", "Let a gentle smile form"], pattern: null },
  { title: "Loving-Kindness", subtitle: "Buddhist practice for joy", steps: ["Place hand on heart", "Say: May I be happy, peaceful", "Wish the same to someone you love", "Extend to all beings", "Rest in this feeling"], pattern: null },
  { title: "Body Scan Release", subtitle: "Release hidden tension", steps: ["Start at top of head", "Notice tension in forehead, jaw", "With each exhale, let it melt", "Move down: neck, chest, belly, legs", "End at feet, feeling grounded"], pattern: null },
  { title: "Mindful Minute", subtitle: "Quick reset anywhere", steps: ["Stop and close your eyes", "Take 5 slow, deep breaths", "Notice 3 things you can hear", "Notice 2 things you can feel", "Notice 1 thing you're grateful for"], pattern: null },
  { title: "Joy Recall", subtitle: "Relive your happiest moments", steps: ["Close your eyes and relax", "Remember a moment of pure joy", "Where were you? Who was there?", "Feel the emotions fully again", "Let a smile spread across your face", "Carry this feeling with you"], pattern: null },
  { title: "Smile Meditation", subtitle: "The happiness feedback loop", steps: ["Sit comfortably and close your eyes", "Gently smile — even if you don't feel it", "Notice how your face muscles feel", "Let the smile soften your eyes", "Feel warmth spreading through you", "Your body tells your mind: be happy"], pattern: null },
  { title: "GLAD Technique", subtitle: "Find four daily wins", steps: ["G — One GOOD thing today", "L — One thing you LEARNED", "A — One small ACCOMPLISHMENT", "D — One thing that DELIGHTED you", "Reflect on each one with gratitude"], pattern: null },
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

// The World Tab Component - Global happiness data only
function TheWorldTab() {
  const [globalSources, setGlobalSources] = useState({});
  const [loading, setLoading] = useState(true);

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

  const formatNumber = (num) => num.toLocaleString();

  // Sort global sources by count
  const sortedGlobal = Object.entries(globalSources)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const maxGlobal = sortedGlobal.length > 0 ? sortedGlobal[0][1] : 1;
  const totalSmiles = Object.values(globalSources).reduce((a, b) => a + b, 0);

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
        <p className="text-sm text-slate-400">smiles shared globally</p>
        
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
  const [quote] = useState(() => getRandomItem(wisdomQuotes));
  
  // Get config based on time and whether ritual was done
  const [checkinConfig] = useState(() => getCheckinConfig());
  const { ritual, isRitual, timeOfDay } = checkinConfig;
  
  // Night ritual gets Dream Insight, others get random exercise
  const [exercise] = useState(() => 
    isRitual && timeOfDay === 'night' ? nightExercise : getRandomItem(exercises)
  );

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

  // Determine which steps to show (rituals have intention, regular doesn't)
  const steps = isRitual && ritual.intentionPrompt 
    ? ['source', 'gratitude', 'wisdom', 'exercise']
    : ['source', 'gratitude', 'wisdom', 'exercise'];

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
              onClick={() => setStep('gratitude')} 
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl"
            >
              Continue →
            </button>
          </>
        )}

        {step === 'gratitude' && (
          <>
            <div className="mb-5">
              <p className="text-green-400 text-sm mb-3 text-center">
                🙏 {ritual.gratitudePrompt}
              </p>
              <textarea
                value={gratitude}
                onChange={e => setGratitude(e.target.value)}
                placeholder={selectedSources.length > 0 ? `Grateful for ${selectedSources.map(s => s.prompt).join(', ')}...` : "Share your gratitude... (optional)"}
                className={`w-full ${isRitual && ritual.intentionPrompt ? 'h-20' : 'h-28'} p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-green-400/50 mb-3`}
              />
              {isRitual && ritual.intentionPrompt && (
                <>
                  <p className="text-amber-400 text-sm mb-2 text-center">
                    ✨ {ritual.intentionPrompt}
                  </p>
                  <textarea
                    value={intention}
                    onChange={e => setIntention(e.target.value)}
                    placeholder="Set your intention... (optional)"
                    className="w-full h-16 p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-400/50 mb-3"
                  />
                </>
              )}
              <button
                onClick={() => shareGratitude(gratitude || (selectedSources.length > 0 ? `Feeling grateful for ${selectedSources.map(s => s.prompt).join(', ')}` : 'this moment of happiness'))}
                className="w-full py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400 text-sm flex items-center justify-center gap-2 hover:bg-pink-500/30 transition"
              >
                💌 Send as Thank You Card
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('source')} className="flex-1 bg-white/10 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep('wisdom')} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
            </div>
          </>
        )}

        {step === 'wisdom' && (
          <>
            <div className="border-l-4 border-green-400 bg-white/5 p-4 rounded-r-xl mb-3">
              <p className="text-lg italic mb-2">"{quote.text}"</p>
              <p className="text-green-400 font-medium">— {quote.author}</p>
              <p className="text-slate-400 text-sm">{quote.tradition}</p>
            </div>
            <button
              onClick={() => shareQuote(quote)}
              className="w-full py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm flex items-center justify-center gap-2 hover:bg-purple-500/30 transition mb-5"
            >
              📤 Share this wisdom
            </button>
            <div className="flex gap-3">
              <button onClick={() => setStep('gratitude')} className="flex-1 bg-white/10 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep('exercise')} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
            </div>
          </>
        )}

        {step === 'exercise' && (
          <>
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
            <button
              onClick={() => shareExercise(exercise)}
              className="w-full py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm flex items-center justify-center gap-2 hover:bg-blue-500/30 transition mb-5"
            >
              😊 Smile and the world smiles with you — share a smile!
            </button>
            <div className="flex gap-3">
              <button onClick={handleSkip} className="flex-1 bg-white/10 py-3 rounded-xl">Skip & Save</button>
              <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">✓ Complete</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Journal View Modal with delete functionality
function JournalModal({ isOpen, onClose, checkins, onDeleteEntry, onClearAll }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  
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
                    <button 
                      onClick={() => setConfirmDelete(entry.id)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                    >
                      🗑️
                    </button>
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
    </div>
  );
}

// Settings Modal
function SettingsModal({ isOpen, onClose, onClearCheckins, onClearAll, stats }) {
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
  const [activeTab, setActiveTab] = useState('timer');
  const [showReminder, setShowReminder] = useState(false);

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
    setCheckins(prev => [...prev, checkin]);
    setShowCheckinModal(false);
    
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div className="text-2xl font-bold text-orange-400">{checkinStreak}</div>
                <div className="text-[10px] text-slate-400 uppercase">Day Streak 🔥</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div className="text-2xl font-bold text-blue-400">{todayCheckins}</div>
                <div className="text-[10px] text-slate-400 uppercase">Check-ins Today</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div className="text-2xl font-bold text-purple-400">{checkins.length}</div>
                <div className="text-[10px] text-slate-400 uppercase">Total Check-ins</div>
              </div>
            </div>

            {/* Journal Button */}
            <button 
              onClick={() => setShowJournalModal(true)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">🙏</span>
                <span>
                  <span className="font-medium block text-left">Gratitude Journal</span>
                  <span className="text-xs text-slate-400">{checkins.length} check-ins</span>
                </span>
              </span>
              <span className="text-slate-400">→</span>
            </button>

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

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>🔒</span>
              <span>All data stays on your device</span>
            </div>
          </>
        )}

        {/* The World Tab */}
        {activeTab === 'world' && (
          <TheWorldTab />
        )}

        <footer className="text-center mt-6 text-slate-500 text-xs">Made with 💛 for a happier {CURRENT_YEAR}</footer>
      </div>

      {/* Modals */}
      <CheckinModal isOpen={showCheckinModal} onClose={() => setShowCheckinModal(false)} onSave={handleCheckinSave} />
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
      />

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
