/* ═══════════════════════════════════════════════════════════════
   MrKing Curriculum — app.js
   Mastery-Based PWA · No frameworks · localStorage persistence
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   ①  CURRICULUM DATA
   ──────────────────────────────────────────────────────────────
   To swap target words:
     • Edit the `targets` array for the relevant level below.
     • Reading levels: each item is a string word.
     • Writing levels: each item is the full sentence string.
   The mastery system is automatic — no other changes needed.
   ────────────────────────────────────────────────────────────── */
const CURRICULUM = [
  {
    id: 1,
    title:  'Letter Sounds',
    type:   'reading',                       // 'reading' | 'writing'
    hint:   'Say this letter sound clearly into your microphone.',
    // ── SWAP THESE WORDS freely ──
    targets: ['a', 'e', 'i', 'o', 'u'],     // 5 vowel letter sounds
  },
  {
    id: 2,
    title:  'CVC Words',
    type:   'reading',
    hint:   'Read this word aloud — nice and clear!',
    // ── SWAP THESE WORDS freely ──
    targets: ['cat', 'dog', 'big', 'sun', 'red'],
  },
  {
    id: 3,
    title:  'Simple Sentences',
    type:   'writing',
    hint:   'Write this sentence on paper, then snap a photo.',
    // ── SWAP THESE SENTENCES freely ──
    targets: [
      'The cat sat.',
      'I see a dog.',
      'The sun is big.',
    ],
  },
];


/* ──────────────────────────────────────────────────────────────
   ②  STUDENT PROGRESS — localStorage schema
   ──────────────────────────────────────────────────────────────
   studentProgress = {
     1: { completed: false, answeredCount: 0, answeredSet: [0,1,...] },
     2: { ... },
     3: { ... }
   }
   ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'mrking_studentProgress';

function defaultProgress() {
  const p = {};
  CURRICULUM.forEach(lvl => {
    p[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
  });
  return p;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultProgress();
  } catch { return defaultProgress(); }
}

function saveProgress(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

let studentProgress = loadProgress();


/* ──────────────────────────────────────────────────────────────
   ③  VIEW ROUTER
   ────────────────────────────────────────────────────────────── */
const views = {
  dashboard:  document.getElementById('view-dashboard'),
  assessment: document.getElementById('view-assessment'),
  complete:   document.getElementById('view-complete'),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[name].classList.add('active');
  window.scrollTo(0, 0);
}


/* ──────────────────────────────────────────────────────────────
   ④  DASHBOARD RENDERING
   ────────────────────────────────────────────────────────────── */
function renderDashboard() {
  CURRICULUM.forEach(lvl => {
    const card      = document.getElementById(`card-level-${lvl.id}`);
    const barFill   = document.getElementById(`bar-level-${lvl.id}`);
    const pctEl     = document.getElementById(`pct-level-${lvl.id}`);
    const statusEl  = document.getElementById(`status-level-${lvl.id}`);
    const prog      = studentProgress[lvl.id];

    // ── Gate-keep: level N locked until level N-1 is completed ──
    const unlocked = lvl.id === 1
      || studentProgress[lvl.id - 1].completed;

    const pct = lvl.targets.length > 0
      ? Math.round((prog.answeredCount / lvl.targets.length) * 100)
      : 0;

    barFill.style.width = pct + '%';
    pctEl.textContent   = pct + '%';

    card.classList.toggle('locked',    !unlocked);
    card.classList.toggle('completed', prog.completed);

    const icon = statusEl.querySelector('.status-icon');
    if (prog.completed)    icon.textContent = '✅';
    else if (!unlocked)    icon.textContent = '🔒';
    else                   icon.textContent = '🔓';

    // Path connector coloring
    if (lvl.id < CURRICULUM.length) {
      const conn = document.getElementById(`connector-${lvl.id}-${lvl.id + 1}`);
      if (conn) conn.classList.toggle('active', prog.completed);
    }
  });

  // Overall mastery bar
  const totalQ    = CURRICULUM.reduce((s, l) => s + l.targets.length, 0);
  const totalDone = CURRICULUM.reduce((s, l) => s + studentProgress[l.id].answeredCount, 0);
  const overall   = totalQ > 0 ? Math.round((totalDone / totalQ) * 100) : 0;
  document.getElementById('overall-mastery-bar').style.width    = overall + '%';
  document.getElementById('overall-mastery-percent').textContent = overall + '%';
}


/* ──────────────────────────────────────────────────────────────
   ⑤  ASSESSMENT ENGINE
   ────────────────────────────────────────────────────────────── */
let currentLevel  = null;   // CURRICULUM item
let currentIndex  = 0;      // index into targets[]
let pendingTargets = [];    // shuffled list of un-answered targets

function openLevel(levelId) {
  const lvl = CURRICULUM.find(l => l.id === levelId);
  if (!lvl) return;

  // Check locked
  const unlocked = lvl.id === 1 || studentProgress[lvl.id - 1].completed;
  if (!unlocked) return;

  currentLevel = lvl;
  const prog   = studentProgress[lvl.id];

  // Remaining unanswered indices (so refresh doesn't re-ask answered ones)
  const answeredSet = new Set(prog.answeredSet);
  pendingTargets = lvl.targets
    .map((t, i) => ({ word: t, idx: i }))
    .filter(item => !answeredSet.has(item.idx));

  // If already completed, reset for replay
  if (prog.completed) {
    studentProgress[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
    saveProgress(studentProgress);
    pendingTargets = lvl.targets.map((t, i) => ({ word: t, idx: i }));
  }

  currentIndex = 0;
  buildAssessmentUI();
  showView('assessment');
  loadQuestion();
}

function buildAssessmentUI() {
  const lvl = currentLevel;

  // Tags
  document.getElementById('assess-level-tag').textContent = `Level ${lvl.id}`;
  document.getElementById('assess-type-tag').textContent  =
    lvl.type === 'reading' ? '📖 Reading' : '✏️ Writing';
  document.getElementById('assess-type-tag').className    =
    `tag ${lvl.type === 'reading' ? 'tag-reading' : 'tag-writing'}`;

  document.getElementById('target-hint').textContent = lvl.hint;

  // Show correct panel
  document.getElementById('panel-reading').classList.toggle('hidden', lvl.type !== 'reading');
  document.getElementById('panel-writing').classList.toggle('hidden', lvl.type !== 'writing');

  // Build progress dots (one per target)
  const dotsContainer = document.getElementById('question-dots');
  dotsContainer.innerHTML = '';
  lvl.targets.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.id = `dot-${i}`;
    dotsContainer.appendChild(dot);
  });

  // Colour already-answered dots
  studentProgress[lvl.id].answeredSet.forEach(idx => {
    const d = document.getElementById(`dot-${idx}`);
    if (d) d.classList.add('done');
  });
}

function loadQuestion() {
  if (currentIndex >= pendingTargets.length) {
    // All questions answered → level complete
    completLevel();
    return;
  }

  const item = pendingTargets[currentIndex];
  document.getElementById('target-word-display').textContent = item.word;

  // Highlight current dot
  const realIdx = item.idx;
  document.querySelectorAll('.dot').forEach(d => d.classList.remove('current'));
  const dot = document.getElementById(`dot-${realIdx}`);
  if (dot) dot.classList.add('current');

  // Reset feedback & transcript
  hideFeedback();
  document.getElementById('transcript-box').innerHTML   = '<em>Listening…</em>';
  document.getElementById('ocr-result-box').innerHTML  = '<em>Photo result will appear here…</em>';
  document.getElementById('ocr-preview').innerHTML     = '';
  stopSpeech();
}

function markCorrect() {
  const item = pendingTargets[currentIndex];
  const prog = studentProgress[currentLevel.id];

  if (!prog.answeredSet.includes(item.idx)) {
    prog.answeredSet.push(item.idx);
    prog.answeredCount = prog.answeredSet.length;
  }
  saveProgress(studentProgress);
  renderDashboard();

  // Colour dot
  const dot = document.getElementById(`dot-${item.idx}`);
  if (dot) { dot.classList.remove('current'); dot.classList.add('done'); }

  showFeedback(true, 'Excellent! 🎉');
}

function completLevel() {
  const prog = studentProgress[currentLevel.id];
  prog.completed = true;
  saveProgress(studentProgress);
  renderDashboard();

  document.getElementById('complete-subtitle').textContent =
    `You've mastered Level ${currentLevel.id}: ${currentLevel.title}!`;
  showView('complete');
}


/* ──────────────────────────────────────────────────────────────
   ⑥  FEEDBACK OVERLAY
   ────────────────────────────────────────────────────────────── */
function showFeedback(correct, msg) {
  const overlay = document.getElementById('feedback-overlay');
  const card    = document.getElementById('feedback-card');
  document.getElementById('feedback-icon').textContent = correct ? '✅' : '❌';
  document.getElementById('feedback-msg').textContent  = msg;
  card.classList.toggle('wrong', !correct);
  document.getElementById('btn-next').textContent = correct ? 'Next →' : 'Try Again';
  overlay.classList.remove('hidden');
}

function hideFeedback() {
  document.getElementById('feedback-overlay').classList.add('hidden');
}

document.getElementById('btn-next').addEventListener('click', () => {
  const correct = !document.getElementById('feedback-card').classList.contains('wrong');
  hideFeedback();
  if (correct) {
    currentIndex++;
    loadQuestion();
  }
  // If wrong, same question reloads
});


/* ──────────────────────────────────────────────────────────────
   ⑦  READING MODULE — Web Speech API
   Three improvements:
     A) Toggle (single click to start/stop — no hold required)
     B) continuous = false → auto-stops after the student speaks
     C) Fuzzy matching for short letter sounds (e.g. target "a")
   ────────────────────────────────────────────────────────────── */

/* ── C) PHONETIC ALIASES ────────────────────────────────────────
   Maps a target sound to words the browser commonly mishears it as.
   Add entries here whenever you find a new false-positive pattern.
   The values are ACCEPTED alternatives (still mark correct) vs
   common confusions — see fuzzyMatch() for how each is used.
   ────────────────────────────────────────────────────────────── */
const PHONETIC_ALIASES = {
  // ── Vowel letter sounds ──
  'a': ['ay', 'aye', 'eh'],       // "ay" / "aye" are valid letter-sound renderings
  'e': ['ee', 'ea'],
  'i': ['eye', 'aye', 'ai'],
  'o': ['oh', 'ow', 'owe'],
  'u': ['oo', 'you', 'yoo', 'yew'],
  // ── Add more entries below as needed, e.g.:
  // 'b': ['be', 'bee'],
  // 'c': ['see', 'sea'],
};

/* ── C) FUZZY MATCH FUNCTION ────────────────────────────────────
   Returns: { match: true }                   — accept as correct
            { match: false, shortSound: true } — show short-sound nudge
            { match: false, shortSound: false} — show generic wrong msg
   ────────────────────────────────────────────────────────────── */
function fuzzyMatch(transcript, target) {
  const t = transcript.trim().toLowerCase();
  const tgt = target.trim().toLowerCase();

  // 1. Exact match
  if (t === tgt) return { match: true };

  // 2. Transcript contains the target as a whole word
  //    e.g. target="cat", transcript="a cat" → still correct
  const wordBoundaryRE = new RegExp(`\\b${tgt}\\b`, 'i');
  if (wordBoundaryRE.test(t)) return { match: true };

  // 3. Accepted phonetic alias → mark correct
  //    e.g. target="a", transcript="ay" → correct
  const aliases = PHONETIC_ALIASES[tgt] || [];
  if (aliases.some(alias => t === alias || t.includes(alias))) {
    return { match: true };
  }

  // 4. Short target (single character = a letter sound).
  //    Browser heard *something* but it wasn't the right sound.
  //    Give a specific coaching nudge instead of a generic error.
  if (tgt.length === 1) {
    return { match: false, shortSound: true };
  }

  // 5. Longer word — generic wrong message
  return { match: false, shortSound: false };
}

let recognition  = null;
let isListening  = false;

function initSpeech() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Web Speech API not supported in this browser.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang           = 'en-US';
  recognition.continuous     = false;  // ── B) auto-stops after student speaks
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.trim().toLowerCase();
    document.getElementById('transcript-box').textContent = `"${transcript}"`;

    const target = pendingTargets[currentIndex].word.trim().toLowerCase();

    // ── C) Run fuzzy match ──
    const result = fuzzyMatch(transcript, target);

    if (result.match) {
      markCorrect();
    } else if (result.shortSound) {
      // Special nudge for single letter-sounds the browser mangled
      showFeedback(false,
        `I heard something else — try saying just the sound again, clearly! 🔊`
      );
    } else {
      // Generic wrong message for multi-character words
      showFeedback(false, `I heard: "${transcript}". Try again!`);
    }
  };

  recognition.onerror = (e) => {
    // 'no-speech' is normal (student was silent); don't alarm them
    if (e.error === 'no-speech') {
      document.getElementById('transcript-box').innerHTML =
        '<em>Nothing heard — tap the mic and try again.</em>';
    } else {
      document.getElementById('transcript-box').textContent = `Error: ${e.error}`;
    }
    setMicIdle();
  };

  // ── B) Browser fires onend automatically when continuous=false ──
  recognition.onend = () => { setMicIdle(); };
}

/* ── A) TOGGLE: single click starts OR stops ────────────────── */
function toggleSpeech() {
  if (isListening) {
    // Second click → manual cancel
    recognition.stop();   // triggers onend → setMicIdle
  } else {
    startSpeech();
  }
}

function startSpeech() {
  if (!recognition) { initSpeech(); }
  if (!recognition) {
    alert('Speech recognition is not available in this browser.\nTry Chrome on Android or desktop.');
    return;
  }
  isListening = true;
  recognition.start();
  const btn = document.getElementById('btn-mic');
  btn.classList.add('active');
  btn.querySelector('.btn-label').textContent = 'Listening… (tap to cancel)';
  document.getElementById('transcript-box').innerHTML = '<em>Listening now…</em>';
}

function stopSpeech() {
  // Called externally (e.g. on back-navigation) to ensure clean state
  if (recognition && isListening) {
    recognition.stop();
  }
  setMicIdle();
}

function setMicIdle() {
  isListening = false;
  const btn = document.getElementById('btn-mic');
  if (btn) {
    btn.classList.remove('active');
    btn.querySelector('.btn-label').textContent = 'Tap to Read Aloud';  // updated label
  }
}

// ── A) Single click listener replaces all the hold events ──
const btnMic = document.getElementById('btn-mic');
btnMic.addEventListener('click', toggleSpeech);


/* ──────────────────────────────────────────────────────────────
   ⑧  WRITING MODULE — Tesseract.js OCR
   ────────────────────────────────────────────────────────────── */
const btnCamera  = document.getElementById('btn-camera');
const cameraInput = document.getElementById('camera-input');

btnCamera.addEventListener('click', () => cameraInput.click());

cameraInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Preview image
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('ocr-preview').innerHTML =
      `<img src="${ev.target.result}" alt="Preview" />`;
  };
  reader.readAsDataURL(file);

  // Show spinner
  document.getElementById('ocr-result-box').innerHTML =
    '<span class="spinner"></span> Processing with Tesseract…';
  btnCamera.disabled = true;

  try {
    // ── On-device OCR via Tesseract.js ──
    const result = await Tesseract.recognize(file, 'eng', {
      logger: () => {},  // suppress verbose logs; set to console.log to debug
    });

    const ocr   = result.data.text.trim();
    const cleaned = ocr.replace(/[^a-zA-Z0-9 .,!?']/g, '').trim().toLowerCase();
    document.getElementById('ocr-result-box').textContent = `Detected: "${ocr}"`;

    // ── Mastery check: compare cleaned OCR to target sentence ──
    const target = pendingTargets[currentIndex].word.trim().toLowerCase();
    const targetCleaned = target.replace(/[^a-zA-Z0-9 .,!?']/g, '');

    if (cleaned.includes(targetCleaned)) {
      markCorrect();
    } else {
      showFeedback(false, `Read: "${ocr.slice(0, 60)}". Didn't match. Try again!`);
    }
  } catch (err) {
    document.getElementById('ocr-result-box').textContent = `OCR Error: ${err.message}`;
  } finally {
    btnCamera.disabled = false;
    // Reset input so the same file can be re-selected
    cameraInput.value = '';
  }
});


/* ──────────────────────────────────────────────────────────────
   ⑨  NAVIGATION EVENTS
   ────────────────────────────────────────────────────────────── */

// Level card clicks
document.querySelectorAll('.level-card').forEach(card => {
  card.addEventListener('click', () => {
    const lvlId = parseInt(card.dataset.level, 10);
    openLevel(lvlId);
  });
});

// Back button
document.getElementById('btn-back').addEventListener('click', () => {
  stopSpeech();
  showView('dashboard');
  renderDashboard();
});

// Level complete → home
document.getElementById('btn-home').addEventListener('click', () => {
  showView('dashboard');
  renderDashboard();
});

// Reset all progress
document.getElementById('btn-reset-progress').addEventListener('click', () => {
  if (confirm('Reset ALL progress? This cannot be undone.')) {
    studentProgress = defaultProgress();
    saveProgress(studentProgress);
    renderDashboard();
  }
});


/* ──────────────────────────────────────────────────────────────
   ⑩  INIT
   ────────────────────────────────────────────────────────────── */
(function init() {
  initSpeech();
  renderDashboard();
  showView('dashboard');
})();
