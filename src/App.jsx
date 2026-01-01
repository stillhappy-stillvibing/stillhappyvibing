import { useState, useEffect } from 'react';

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
  { title: "Gratitude Visualization", subtitle: "Shift to abundance", steps: ["Close eyes, take 3 deep breaths", "Picture someone you love smiling", "Feel warmth in your chest", "Think of 3 things you're grateful for", "Let a gentle smile form"], pattern: null },
  { title: "Loving-Kindness", subtitle: "Buddhist practice for joy", steps: ["Place hand on heart", "Say: May I be happy, peaceful", "Wish the same to someone you love", "Extend to all beings", "Rest in this feeling"], pattern: null },
  { title: "Body Scan Release", subtitle: "Release hidden tension", steps: ["Start at top of head", "Notice tension in forehead, jaw", "With each exhale, let it melt", "Move down: neck, chest, belly, legs", "End at feet, feeling grounded"], pattern: null },
  { title: "Mindful Minute", subtitle: "Quick reset anywhere", steps: ["Stop and close your eyes", "Take 5 slow, deep breaths", "Notice 3 things you can hear", "Notice 2 things you can feel", "Notice 1 thing you're grateful for"], pattern: null },
];

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

const badges = [
  { id: 'first-hour', name: 'First Hour', threshold: 3600000, icon: '🌱' },
  { id: 'half-day', name: 'Half Day', threshold: 43200000, icon: '🌤️' },
  { id: 'full-day', name: 'Full Day', threshold: 86400000, icon: '☀️' },
  { id: 'two-days', name: '2 Days', threshold: 172800000, icon: '🏆' },
  { id: 'week', name: 'One Week', threshold: 604800000, icon: '🌈' },
  { id: 'two-weeks', name: '2 Weeks', threshold: 1209600000, icon: '✨' },
  { id: 'month', name: 'Month Master', threshold: 2592000000, icon: '👑' },
];

const checkinBadges = [
  { id: 'first-checkin', name: 'First Check-in', threshold: 1, icon: '📝' },
  { id: 'streak-3', name: '3 Day Streak', threshold: 3, icon: '🔥' },
  { id: 'streak-7', name: 'Week Streak', threshold: 7, icon: '⚡' },
  { id: 'streak-30', name: 'Month Streak', threshold: 30, icon: '💫' },
  { id: 'entries-10', name: '10 Entries', threshold: 10, icon: '📚', type: 'total' },
  { id: 'entries-50', name: '50 Entries', threshold: 50, icon: '🎯', type: 'total' },
];

// Dynamic - always uses current year
const CURRENT_YEAR = new Date().getFullYear();
const NEW_YEAR_START = new Date(`${CURRENT_YEAR}-01-01T00:00:00`).getTime();

const formatDuration = (ms, style = 'short') => {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (style === 'long') {
    let parts = [];
    if (d > 0) parts.push(`${d} day${d !== 1 ? 's' : ''}`);
    if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} min${m !== 1 ? 's' : ''}`);
    if (sec > 0 || parts.length === 0) parts.push(`${sec} sec`);
    return parts.join(', ');
  }
  let parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (sec > 0 || parts.length === 0) parts.push(`${sec}s`);
  return parts.join(' ');
};

const msToTimeUnits = (ms) => {
  if (ms < 0) ms = 0;
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000)
  };
};

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

// Timer Display Component
function TimerDisplay({ time, label, color = "yellow" }) {
  const colorClasses = {
    yellow: "bg-yellow-400/10 border-yellow-400/30 text-yellow-400",
    green: "bg-green-400/10 border-green-400/30 text-green-400",
  };
  
  return (
    <div>
      <p className="text-slate-400 uppercase tracking-widest text-xs mb-2 text-center">{label}</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {[
          { v: time.days, l: 'Days' }, 
          { v: time.hours, l: 'Hrs' }, 
          { v: time.minutes, l: 'Min' }, 
          { v: time.seconds, l: 'Sec' }
        ].map((u, i) => (
          <div key={i} className={`${colorClasses[color]} border rounded-xl px-2 py-2 min-w-[50px]`}>
            <div className="text-xl font-bold tabular-nums">{String(u.v).padStart(2, '0')}</div>
            <div className="text-[9px] text-slate-400 uppercase">{u.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Check-in Modal Component - Gratitude & Happiness Source Tracker
function CheckinModal({ isOpen, onClose, onSave, streakMs }) {
  const [step, setStep] = useState('source');
  const [source, setSource] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [quote] = useState(() => getRandomItem(wisdomQuotes));
  const [exercise] = useState(() => getRandomItem(exercises));

  const happinessSources = [
    { id: 'work', label: '💼 Work going well', prompt: 'work' },
    { id: 'relationship', label: '💕 Loved ones', prompt: 'your loved ones' },
    { id: 'health', label: '🏃 Health/Exercise', prompt: 'your health' },
    { id: 'peace', label: '😌 Inner peace', prompt: 'inner peace' },
    { id: 'nature', label: '🌿 Nature/Outdoors', prompt: 'nature' },
    { id: 'achievement', label: '🎯 Achievement', prompt: 'this achievement' },
    { id: 'fun', label: '🎉 Fun/Play', prompt: 'this moment of fun' },
    { id: 'rest', label: '😴 Good rest', prompt: 'rest' },
  ];

  const selectedSource = happinessSources.find(s => s.id === source);

  const handleSave = () => {
    onSave({ source, gratitude, quote: quote.author });
    setSource('');
    setGratitude('');
    setStep('source');
  };

  const handleSkip = () => {
    onSave({ source: source || '', gratitude: '', quote: quote.author });
    setSource('');
    setGratitude('');
    setStep('source');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-green-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🌟</div>
          <h2 className="text-xl font-bold">Happiness Check-in</h2>
          <p className="text-slate-400 text-sm">Current streak: {formatDuration(streakMs)}</p>
        </div>

        <div className="flex justify-center gap-2 mb-5">
          {['source', 'gratitude', 'wisdom', 'exercise'].map(s => (
            <button key={s} onClick={() => setStep(s)} className={`w-2.5 h-2.5 rounded-full transition ${step === s ? 'bg-green-400' : 'bg-white/20'}`} />
          ))}
        </div>

        {step === 'source' && (
          <>
            <p className="text-center text-slate-300 mb-4">What's bringing you happiness right now?</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {happinessSources.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSource(source === s.id ? '' : s.id)}
                  className={`p-3 rounded-xl text-sm text-left transition ${source === s.id ? 'bg-green-400/20 border border-green-400/50' : 'bg-white/5 hover:bg-white/10'}`}
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
                🙏 Who or what are you grateful for that brought you happiness
                {selectedSource ? ` with ${selectedSource.prompt}` : ''}?
              </p>
              <textarea
                value={gratitude}
                onChange={e => setGratitude(e.target.value)}
                placeholder="Share your gratitude... (optional)"
                className="w-full h-28 p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-green-400/50"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('source')} className="flex-1 bg-white/10 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep('wisdom')} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
            </div>
          </>
        )}

        {step === 'wisdom' && (
          <>
            <div className="border-l-4 border-green-400 bg-white/5 p-4 rounded-r-xl mb-5">
              <p className="text-lg italic mb-2">"{quote.text}"</p>
              <p className="text-green-400 font-medium">— {quote.author}</p>
              <p className="text-slate-400 text-sm">{quote.tradition}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('gratitude')} className="flex-1 bg-white/10 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep('exercise')} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
            </div>
          </>
        )}

        {step === 'exercise' && (
          <>
            <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-4 mb-5">
              <h3 className="text-green-400 font-semibold mb-1">🧘 {exercise.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{exercise.subtitle}</p>
              {exercise.pattern && <BreathingGuide pattern={exercise.pattern} />}
              <ul className="space-y-1 text-sm mt-3">
                {exercise.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="text-green-400">•</span>{s}</li>)}
              </ul>
            </div>
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

// End Happiness Modal Component
function EndModal({ isOpen, onClose, streakMs, onSave }) {
  const [quote] = useState(() => getRandomItem(wisdomQuotes));
  const [exercise] = useState(() => getRandomItem(exercises));
  const [reason, setReason] = useState('');
  const [journal, setJournal] = useState('');
  const [step, setStep] = useState('wisdom');

  const breakReasons = [
    { id: 'work', label: '💼 Work stress' },
    { id: 'relationship', label: '💔 Relationship' },
    { id: 'health', label: '🏥 Health' },
    { id: 'anxiety', label: '😰 Anxiety' },
    { id: 'news', label: '📰 News/World' },
    { id: 'money', label: '💸 Money' },
    { id: 'tired', label: '😴 Exhaustion' },
    { id: 'conflict', label: '⚡ Conflict' },
  ];

  const handleSave = () => {
    onSave({ reason, journal });
    setReason(''); setJournal(''); setStep('wisdom');
  };

  const handleShare = async () => {
    const text = `My happiness streak lasted ${formatDuration(streakMs, 'long')} in ${CURRENT_YEAR}! ✨\n\nHow long can YOU keep the joy alive?`;
    if (navigator.share) {
      try { await navigator.share({ title: `${CURRENT_YEAR} Happiness Tracker`, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard! 📋');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl max-w-lg w-full p-6 border border-yellow-400/20 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-5xl mb-2">🌅</div>
          <h2 className="text-2xl font-bold">A Moment to Reset</h2>
        </div>

        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 text-center mb-5">
          <p className="text-slate-400 text-sm">This happiness streak lasted</p>
          <p className="text-2xl font-bold text-yellow-400">{formatDuration(streakMs, 'long')}</p>
        </div>

        <div className="flex justify-center gap-2 mb-5">
          {['wisdom', 'reason', 'exercise'].map(s => (
            <button key={s} onClick={() => setStep(s)} className={`w-2.5 h-2.5 rounded-full transition ${step === s ? 'bg-yellow-400' : 'bg-white/20'}`} />
          ))}
        </div>

        {step === 'wisdom' && (
          <>
            <div className="border-l-4 border-yellow-400 bg-white/5 p-4 rounded-r-xl mb-5">
              <p className="text-lg italic mb-2">"{quote.text}"</p>
              <p className="text-yellow-400 font-medium">— {quote.author}</p>
              <p className="text-slate-400 text-sm">{quote.tradition}</p>
            </div>
            <button onClick={() => setStep('reason')} className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
          </>
        )}

        {step === 'reason' && (
          <>
            <div className="mb-4">
              <p className="text-yellow-400 text-sm mb-3">What broke your streak? (optional)</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {breakReasons.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setReason(reason === r.id ? '' : r.id)}
                    className={`p-3 rounded-xl text-sm text-left transition ${reason === r.id ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5 hover:bg-white/10'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-slate-400 text-sm mb-2">💭 Any reflections?</p>
              <textarea
                value={journal}
                onChange={e => setJournal(e.target.value)}
                placeholder="What happened? What did you learn? (optional)"
                className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-yellow-400/50"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('wisdom')} className="flex-1 bg-white/10 py-3 rounded-xl">← Back</button>
              <button onClick={() => setStep('exercise')} className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold py-3 rounded-xl">Continue →</button>
            </div>
          </>
        )}

        {step === 'exercise' && (
          <>
            <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-4 mb-5">
              <h3 className="text-green-400 font-semibold mb-1">🧘 {exercise.title}</h3>
              <p className="text-slate-400 text-sm mb-3">{exercise.subtitle}</p>
              {exercise.pattern && <BreathingGuide pattern={exercise.pattern} />}
              <ul className="space-y-1 text-sm mt-3">
                {exercise.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="text-green-400">•</span>{s}</li>)}
              </ul>
            </div>
            <div className="flex gap-3 mb-3">
              <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 font-bold py-3 rounded-xl">🌟 Begin Again</button>
              <button onClick={handleShare} className="flex-1 bg-white/10 border border-white/20 py-3 rounded-xl">📤 Share</button>
            </div>
            <button onClick={onClose} className="w-full text-slate-400 text-sm">Just close</button>
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
              {sorted.map((entry) => (
                <div key={entry.id} className="bg-white/5 rounded-xl p-4 relative group">
                  <button 
                    onClick={() => setConfirmDelete(entry.id)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  >
                    🗑️
                  </button>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.source ? (
                        <span className="text-sm bg-green-400/20 text-green-400 px-2 py-1 rounded-full">
                          {sourceLabels[entry.source] || entry.source}
                        </span>
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
                  {entry.streakDuration && (
                    <p className="text-xs text-slate-500 mt-2">At {formatDuration(entry.streakDuration)} into streak</p>
                  )}
                </div>
              ))}
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
function SettingsModal({ isOpen, onClose, onClearCheckins, onClearLeaderboard, onClearAll, onResetStreak, stats }) {
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
    // Note: For persistent notifications, we'd need a service worker
    // This sets up the time for the service worker to use
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

  const handleResetToNewYear = () => {
    localStorage.removeItem(`happinessStreakStart${CURRENT_YEAR}`);
    window.location.reload();
  };
  
  if (!isOpen) return null;

  const actions = [
    { id: 'streak', label: 'Reset Current Streak', desc: 'Start fresh without saving', onConfirm: onResetStreak, danger: false },
    { id: 'newyear', label: 'Reset Streak to New Year', desc: 'Fix if timer looks wrong', onConfirm: handleResetToNewYear, danger: false },
    { id: 'checkins', label: 'Clear Check-ins & Journal', desc: `${stats.checkins} entries`, onConfirm: onClearCheckins },
    { id: 'leaderboard', label: 'Clear Leaderboard', desc: `${stats.entries} entries`, onConfirm: onClearLeaderboard },
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
            <li>• All data stored locally on your device</li>
            <li>• Nothing sent to any server</li>
            <li>• Only you can see your journal</li>
            <li>• Clear anytime using options below</li>
          </ul>
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
              <span className={action.danger === false ? "text-yellow-400" : "text-red-400"}>
                {action.danger === false ? "🔄" : "🗑️"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction?.onConfirm()}
        title={`${confirmAction?.label}?`}
        message={confirmAction?.danger === false 
          ? "Your streak timer will reset to zero. This won't affect your leaderboard or journal."
          : "This action cannot be undone. Your data will be permanently deleted."}
        confirmText={confirmAction?.danger === false ? "Reset" : "Delete"}
        danger={confirmAction?.danger !== false}
      />
    </div>
  );
}

// Main App
export default function App() {
  // Year timer (since Jan 1 of current year)
  const [yearTime, setYearTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [yearMs, setYearMs] = useState(0);
  
  // Streak timer (since last reset/end)
  const [streakStartTime, setStreakStartTime] = useState(() => {
    const saved = localStorage.getItem(`happinessStreakStart${CURRENT_YEAR}`);
    return saved ? parseInt(saved) : NEW_YEAR_START; // Default to start of current year
  });
  const [streakTime, setStreakTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [streakMs, setStreakMs] = useState(0);

  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`happinessLeaderboard${CURRENT_YEAR}`) || '[]'); } catch { return []; }
  });
  const [checkins, setCheckins] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`happinessCheckins${CURRENT_YEAR}`) || '[]'); } catch { return []; }
  });
  
  const [showEndModal, setShowEndModal] = useState(false);
  const [frozenStreakMs, setFrozenStreakMs] = useState(0); // Captured at moment of ending
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('timer');
  const [showReminder, setShowReminder] = useState(false);

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

  // Update timers every second
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      
      // Year timer
      const yearDiff = Math.max(0, now - NEW_YEAR_START);
      setYearMs(yearDiff);
      setYearTime(msToTimeUnits(yearDiff));
      
      // Streak timer
      const streakDiff = Math.max(0, now - streakStartTime);
      setStreakMs(streakDiff);
      setStreakTime(msToTimeUnits(streakDiff));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [streakStartTime]);

  // Save streak start time
  useEffect(() => {
    localStorage.setItem(`happinessStreakStart${CURRENT_YEAR}`, streakStartTime.toString());
  }, [streakStartTime]);

  useEffect(() => {
    localStorage.setItem(`happinessLeaderboard${CURRENT_YEAR}`, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(`happinessCheckins${CURRENT_YEAR}`, JSON.stringify(checkins));
  }, [checkins]);

  const resetStreakToNow = () => {
    setStreakStartTime(Date.now());
  };

  const resetStreakToNewYear = () => {
    setStreakStartTime(NEW_YEAR_START);
  };

  const handleEndSave = ({ reason, journal }) => {
    const entry = { 
      id: Date.now(), 
      reason: reason || '',
      duration: frozenStreakMs, // Use frozen time, not live time
      journal, 
      timestamp: new Date().toISOString() 
    };
    setEntries(prev => [...prev, entry]);
    setShowEndModal(false);
    resetStreakToNow();
  };

  const handleCheckinSave = ({ source, gratitude, quote }) => {
    const checkin = { 
      id: Date.now(), 
      source,
      gratitude,
      quote, 
      streakDuration: streakMs,
      timestamp: new Date().toISOString() 
    };
    setCheckins(prev => [...prev, checkin]);
    setShowCheckinModal(false);
  };

  const handleDeleteCheckin = (id) => {
    setCheckins(prev => prev.filter(c => c.id !== id));
  };

  const handleClearCheckins = () => {
    setCheckins([]);
    localStorage.removeItem(`happinessCheckins${CURRENT_YEAR}`);
    resetStreakToNewYear(); // Revert to start of year
  };

  const handleClearLeaderboard = () => {
    setEntries([]);
    localStorage.removeItem(`happinessLeaderboard${CURRENT_YEAR}`);
    resetStreakToNewYear(); // Revert to start of year
  };

  const handleClearAll = () => {
    setCheckins([]);
    setEntries([]);
    resetStreakToNewYear();
    localStorage.removeItem(`happinessCheckins${CURRENT_YEAR}`);
    localStorage.removeItem(`happinessLeaderboard${CURRENT_YEAR}`);
    localStorage.removeItem(`happinessStreakStart${CURRENT_YEAR}`);
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

  const sorted = [...entries].sort((a, b) => b.duration - a.duration).slice(0, 10);
  const stats = entries.length > 0 ? {
    total: entries.length,
    avg: entries.reduce((a, b) => a + b.duration, 0) / entries.length,
    best: Math.max(...entries.map(e => e.duration))
  } : null;
  const earnedBadges = badges.filter(b => stats && stats.best >= b.threshold);
  const earnedCheckinBadges = checkinBadges.filter(b => 
    b.type === 'total' ? checkins.length >= b.threshold : checkinStreak >= b.threshold
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <header className="text-center py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">✨ Happiness Tracker ✨</h1>
            <button onClick={() => setShowSettingsModal(true)} className="text-slate-400 hover:text-white text-xl">⚙️</button>
          </div>
          <span className="inline-block px-4 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-bold rounded-full text-sm">🎉 {CURRENT_YEAR} 🎉</span>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-4">
          {[
            { id: 'timer', label: '⏱️ Timer' },
            { id: 'progress', label: '📊 Progress' },
            { id: 'leaderboard', label: '🏆 Board' },
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
              {/* Year Timer */}
              <div className="mb-4">
                <TimerDisplay time={yearTime} label={`Time in ${CURRENT_YEAR}`} color="yellow" />
              </div>
              
              {/* Current Streak Timer */}
              <div className="mb-5 pt-4 border-t border-white/10">
                <TimerDisplay time={streakTime} label="Your Current Happiness Streak" color="green" />
              </div>
              
              <p className="text-green-400 mb-4 flex items-center justify-center gap-2 text-sm">
                <span className="animate-pulse">💚</span> Your happiness is thriving! <span className="animate-pulse">💚</span>
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCheckinModal(true)} 
                  className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 text-slate-900 px-4 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg shadow-green-500/20"
                >
                  ✓ Check In
                </button>
                <button 
                  onClick={() => {
                    setFrozenStreakMs(streakMs); // Capture current streak
                    setShowEndModal(true);
                  }} 
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 rounded-xl font-semibold hover:scale-105 transition shadow-lg shadow-red-500/20"
                >
                  😢 End Streak
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div className="text-2xl font-bold text-orange-400">{checkinStreak}</div>
                <div className="text-[10px] text-slate-400 uppercase">Day Streak</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div className="text-2xl font-bold text-blue-400">{todayCheckins}</div>
                <div className="text-[10px] text-slate-400 uppercase">Today</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <div className="text-2xl font-bold text-purple-400">{checkins.length}</div>
                <div className="text-[10px] text-slate-400 uppercase">Total</div>
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

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>🔒</span>
              <span>All data stays on your device</span>
            </div>
          </>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <>
            {/* Happiness Sources Chart */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-4 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">💚 What Brings You Happiness</h3>
              {checkins.length === 0 ? (
                <p className="text-center text-slate-400 py-4 text-sm">Check in to see your happiness sources</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const sourceLabels = {
                      work: '💼 Work',
                      relationship: '💕 Loved ones',
                      health: '🏃 Health',
                      peace: '😌 Peace',
                      nature: '🌿 Nature',
                      achievement: '🎯 Achievement',
                      fun: '🎉 Fun',
                      rest: '😴 Rest',
                    };
                    const counts = checkins.reduce((acc, c) => {
                      if (c.source) acc[c.source] = (acc[c.source] || 0) + 1;
                      return acc;
                    }, {});
                    const maxCount = Math.max(...Object.values(counts), 1);
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                    
                    if (sorted.length === 0) {
                      return <p className="text-center text-slate-400 py-2 text-sm">Select a source during check-in to track patterns</p>;
                    }
                    
                    return sorted.map(([source, count]) => (
                      <div key={source} className="flex items-center gap-2">
                        <span className="text-sm w-24 truncate">{sourceLabels[source] || source}</span>
                        <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 mb-4 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">🏅 Check-in Badges <span className="text-sm font-normal text-slate-400">({earnedCheckinBadges.length}/{checkinBadges.length})</span></h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {checkinBadges.map(b => (
                  <div key={b.id} className={`flex flex-col items-center p-2 rounded-lg transition ${earnedCheckinBadges.some(e => e.id === b.id) ? 'bg-green-400/20' : 'bg-white/5 opacity-40'}`}>
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-[9px] mt-1">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
              <h3 className="font-semibold mb-3 flex items-center gap-2">⏱️ Streak Badges <span className="text-sm font-normal text-slate-400">({earnedBadges.length}/{badges.length})</span></h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {badges.map(b => (
                  <div key={b.id} className={`flex flex-col items-center p-2 rounded-lg transition ${earnedBadges.some(e => e.id === b.id) ? 'bg-yellow-400/20' : 'bg-white/5 opacity-40'}`}>
                    <span className="text-2xl">{b.icon}</span>
                    <span className="text-[9px] mt-1">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <h2 className="font-semibold mb-3">🏆 Completed Happiness Streaks</h2>
            {sorted.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-2xl mb-2">🌟</p>
                <p>No completed streaks yet</p>
                <p className="text-sm">End a streak to record it here</p>
              </div>
            ) : (
              <>
                <ul className="space-y-2 mb-4">
                  {sorted.map((e, i) => {
                    const reasonLabels = {
                      work: '💼 Work',
                      relationship: '💔 Relationship',
                      health: '🏥 Health',
                      anxiety: '😰 Anxiety',
                      news: '📰 News',
                      money: '💸 Money',
                      tired: '😴 Exhaustion',
                      conflict: '⚡ Conflict',
                    };
                    return (
                      <li key={e.id} className="flex items-center p-2 bg-white/5 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-2 text-sm ${i === 0 ? 'bg-yellow-400 text-slate-900' : i === 1 ? 'bg-slate-300 text-slate-900' : i === 2 ? 'bg-amber-600' : 'bg-white/10'}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">
                            {e.reason ? reasonLabels[e.reason] || e.reason : '—'}
                          </div>
                          <div className="text-[10px] text-slate-400">{formatDate(e.timestamp)}</div>
                        </div>
                        <div className="text-green-400 font-bold text-sm">{formatDuration(e.duration)}</div>
                      </li>
                    );
                  })}
                </ul>
                {stats && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-yellow-400">{stats.total}</div>
                      <div className="text-[9px] text-slate-400 uppercase">Streaks</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-yellow-400">{formatDuration(stats.avg)}</div>
                      <div className="text-[9px] text-slate-400 uppercase">Average</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-yellow-400">{formatDuration(stats.best)}</div>
                      <div className="text-[9px] text-slate-400 uppercase">Record</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <footer className="text-center mt-6 text-slate-500 text-xs">Made with 💛 for a happier {CURRENT_YEAR}</footer>
      </div>

      {/* Modals */}
      <CheckinModal isOpen={showCheckinModal} onClose={() => setShowCheckinModal(false)} onSave={handleCheckinSave} streakMs={streakMs} />
      <EndModal isOpen={showEndModal} onClose={() => setShowEndModal(false)} streakMs={frozenStreakMs} onSave={handleEndSave} />
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
        onClearLeaderboard={handleClearLeaderboard}
        onClearAll={handleClearAll}
        onResetStreak={resetStreakToNow}
        stats={{ checkins: checkins.length, entries: entries.length }}
      />
    </div>
  );
}