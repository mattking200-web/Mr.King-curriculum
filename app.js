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
   ────────────────────────────────────────────────────────────── */
let recognition     = null;
let isListening     = false;

function initSpeech() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Web Speech API not supported in this browser.');
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang        = 'en-US';
  recognition.continuous  = false;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.trim().toLowerCase();
    document.getElementById('transcript-box').textContent = `"${transcript}"`;

    // ── Mastery check: compare to target (case-insensitive, trimmed) ──
    const target = pendingTargets[currentIndex].word.trim().toLowerCase();
    if (transcript === target) {
      markCorrect();
    } else {
      showFeedback(false, `I heard: "${transcript}". Try again!`);
    }
  };

  recognition.onerror = (e) => {
    document.getElementById('transcript-box').textContent = `Error: ${e.error}`;
    setMicIdle();
  };

  recognition.onend = () => { setMicIdle(); };
}

function startSpeech() {
  if (!recognition) { initSpeech(); }
  if (!recognition) {
    alert('Speech recognition is not available in this browser. Try Chrome on Android or desktop.');
    return;
  }
  isListening = true;
  recognition.start();
  document.getElementById('btn-mic').classList.add('active');
  document.getElementById('btn-mic').querySelector('.btn-label').textContent = 'Listening… (release)';
  document.getElementById('transcript-box').innerHTML = '<em>Listening now…</em>';
}

function stopSpeech() {
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
    btn.querySelector('.btn-label').textContent = 'Hold to Read Aloud';
  }
}

// Touch & mouse events for mic (hold to record)
const btnMic = document.getElementById('btn-mic');
btnMic.addEventListener('mousedown',  startSpeech);
btnMic.addEventListener('touchstart', (e) => { e.preventDefault(); startSpeech(); }, { passive: false });
btnMic.addEventListener('mouseup',    stopSpeech);
btnMic.addEventListener('mouseleave', stopSpeech);
btnMic.addEventListener('touchend',   stopSpeech);


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
