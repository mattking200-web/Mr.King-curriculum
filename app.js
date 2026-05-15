/* ═══════════════════════════════════════════════════════════════
   MrKing Curriculum — app.js  (clean rewrite)
   ═══════════════════════════════════════════════════════════════ */

/* ── CURRICULUM DATA — edit targets arrays to swap words ── */
const CURRICULUM = [
  {
    id: 1, title: 'Letter Sounds', type: 'reading',
    hint: 'Tap the mic, then say the sound clearly.',
    targets: ['a', 'e', 'i', 'o', 'u'],
  },
  {
    id: 2, title: 'CVC Words', type: 'reading',
    hint: 'Tap the mic, then read the word aloud.',
    targets: ['cat', 'dog', 'big', 'sun', 'red'],
  },
  {
    id: 3, title: 'Simple Sentences', type: 'writing',
    hint: 'Write this sentence on paper, then snap a photo.',
    targets: ['The cat sat.', 'I see a dog.', 'The sun is big.'],
  },
];

/* ── PHONETIC ALIASES — add more as needed ── */
const PHONETIC_ALIASES = {
  'a': ['ay', 'aye', 'eh'],
  'e': ['ee', 'ea'],
  'i': ['eye', 'aye', 'ai'],
  'o': ['oh', 'ow', 'owe'],
  'u': ['oo', 'you', 'yoo', 'yew'],
};

/* ── PERSISTENCE ── */
const STORAGE_KEY = 'mrking_v2';

function defaultProgress() {
  const p = {};
  CURRICULUM.forEach(function(lvl) {
    p[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
  });
  return p;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    CURRICULUM.forEach(function(lvl) {
      if (!parsed[lvl.id]) parsed[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
    });
    return parsed;
  } catch(e) { return defaultProgress(); }
}

function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch(e) {}
}

let progress = loadProgress();

/* ── VIEW ROUTER ── */
function showView(name) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  const el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

/* ── DASHBOARD ── */
function renderDashboard() {
  let totalQ = 0, totalDone = 0;
  CURRICULUM.forEach(function(lvl) {
    const prog     = progress[lvl.id];
    const unlocked = lvl.id === 1 || progress[lvl.id - 1].completed;
    const pct      = lvl.targets.length ? Math.round((prog.answeredCount / lvl.targets.length) * 100) : 0;
    totalQ    += lvl.targets.length;
    totalDone += prog.answeredCount;

    const card     = document.getElementById('card-level-'   + lvl.id);
    const barFill  = document.getElementById('bar-level-'    + lvl.id);
    const pctEl    = document.getElementById('pct-level-'    + lvl.id);
    const statusEl = document.getElementById('status-level-' + lvl.id);
    if (!card) return;

    barFill.style.width = pct + '%';
    pctEl.textContent   = pct + '%';
    card.classList.toggle('locked',    !unlocked);
    card.classList.toggle('completed', !!prog.completed);
    statusEl.querySelector('.status-icon').textContent = prog.completed ? '✅' : unlocked ? '🔓' : '🔒';

    const conn = document.getElementById('connector-' + lvl.id + '-' + (lvl.id + 1));
    if (conn) conn.classList.toggle('active', !!prog.completed);
  });
  const overall = totalQ ? Math.round((totalDone / totalQ) * 100) : 0;
  document.getElementById('overall-mastery-bar').style.width     = overall + '%';
  document.getElementById('overall-mastery-percent').textContent = overall + '%';
}

/* ── ASSESSMENT STATE ── */
let currentLevel   = null;
let pendingTargets = [];
let currentIndex   = 0;

function openLevel(levelId) {
  const lvl = CURRICULUM.find(function(l) { return l.id === levelId; });
  if (!lvl) return;
  if (lvl.id !== 1 && !progress[lvl.id - 1].completed) return;

  currentLevel = lvl;
  if (progress[lvl.id].completed) {
    progress[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
    saveProgress();
  }
  const done = new Set(progress[lvl.id].answeredSet);
  pendingTargets = lvl.targets
    .map(function(word, idx) { return { word: word, idx: idx }; })
    .filter(function(item) { return !done.has(item.idx); });

  currentIndex = 0;
  setupAssessmentView();
  showView('assessment');
  loadQuestion();
}

function setupAssessmentView() {
  const lvl = currentLevel;
  document.getElementById('assess-level-tag').textContent = 'Level ' + lvl.id;
  document.getElementById('assess-type-tag').textContent  = lvl.type === 'reading' ? '📖 Reading' : '✏️ Writing';
  document.getElementById('assess-type-tag').className    = 'tag ' + (lvl.type === 'reading' ? 'tag-reading' : 'tag-writing');
  document.getElementById('target-hint').textContent      = lvl.hint;
  document.getElementById('panel-reading').classList.toggle('hidden', lvl.type !== 'reading');
  document.getElementById('panel-writing').classList.toggle('hidden', lvl.type !== 'writing');

  const container = document.getElementById('question-dots');
  container.innerHTML = '';
  lvl.targets.forEach(function(_, i) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (progress[lvl.id].answeredSet.indexOf(i) !== -1 ? ' done' : '');
    dot.id = 'dot-' + i;
    container.appendChild(dot);
  });
}

function loadQuestion() {
  if (currentIndex >= pendingTargets.length) { completeLevel(); return; }
  const item = pendingTargets[currentIndex];
  document.getElementById('target-word-display').textContent = item.word;
  document.querySelectorAll('.dot').forEach(function(d) { d.classList.remove('current'); });
  const dot = document.getElementById('dot-' + item.idx);
  if (dot) dot.classList.add('current');
  hideFeedback();
  micSetIdle();
  document.getElementById('transcript-box').innerHTML = '<em>Tap the mic and say the word.</em>';
  document.getElementById('ocr-result-box').innerHTML = '<em>Photo result will appear here.</em>';
  document.getElementById('ocr-preview').innerHTML    = '';
}

function markCorrect() {
  const item = pendingTargets[currentIndex];
  const prog = progress[currentLevel.id];
  if (prog.answeredSet.indexOf(item.idx) === -1) {
    prog.answeredSet.push(item.idx);
    prog.answeredCount = prog.answeredSet.length;
    saveProgress();
    renderDashboard();
  }
  const dot = document.getElementById('dot-' + item.idx);
  if (dot) { dot.classList.remove('current'); dot.classList.add('done'); }
  showFeedback(true, 'Excellent! 🎉');
}

function completeLevel() {
  progress[currentLevel.id].completed = true;
  saveProgress();
  renderDashboard();
  document.getElementById('complete-subtitle').textContent =
    "You've mastered Level " + currentLevel.id + ': ' + currentLevel.title + '!';
  showView('complete');
}

/* ── FEEDBACK ── */
function showFeedback(correct, msg) {
  document.getElementById('feedback-icon').textContent = correct ? '✅' : '❌';
  document.getElementById('feedback-msg').textContent  = msg;
  document.getElementById('feedback-card').classList.toggle('wrong', !correct);
  document.getElementById('btn-next').textContent      = correct ? 'Next →' : 'Try Again';
  document.getElementById('feedback-overlay').classList.remove('hidden');
}
function hideFeedback() {
  document.getElementById('feedback-overlay').classList.add('hidden');
}

document.getElementById('btn-next').addEventListener('click', function() {
  const wasCorrect = !document.getElementById('feedback-card').classList.contains('wrong');
  hideFeedback();
  if (wasCorrect) { currentIndex++; loadQuestion(); }
});

/* ── SPEECH RECOGNITION ── */
let micActive = false;
let micTimer  = null;

function fuzzyMatch(transcript, target) {
  const t   = transcript.trim().toLowerCase();
  const tgt = target.trim().toLowerCase();
  if (t === tgt) return { ok: true };
  if (new RegExp('\\b' + tgt + '\\b', 'i').test(t)) return { ok: true };
  const aliases = PHONETIC_ALIASES[tgt] || [];
  for (let i = 0; i < aliases.length; i++) {
    if (t === aliases[i] || t.indexOf(aliases[i]) !== -1) return { ok: true };
  }
  return { ok: false, shortSound: tgt.length === 1 };
}

function micSetActive() {
  micActive = true;
  const btn = document.getElementById('btn-mic');
  btn.classList.add('active');
  btn.querySelector('.btn-label').textContent = 'Listening… tap to stop';
}

function micSetIdle() {
  micActive = false;
  clearTimeout(micTimer);
  const btn = document.getElementById('btn-mic');
  if (!btn) return;
  btn.classList.remove('active');
  btn.querySelector('.btn-label').textContent = 'Tap to Read Aloud';
}

function startListening() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('transcript-box').textContent =
      'Speech recognition not available. Please use Chrome on Android or desktop.';
    return;
  }
  const rec = new SR();
  rec.lang           = 'en-US';
  rec.continuous     = true;
  rec.interimResults = false;
  rec.maxAlternatives = 3;

  rec.onstart = function() {
    micSetActive();
    document.getElementById('transcript-box').innerHTML = '<em>Listening — say the word now!</em>';
    micTimer = setTimeout(function() {
      rec.stop();
      document.getElementById('transcript-box').innerHTML = '<em>Nothing heard — tap the mic and try again.</em>';
    }, 8000);
  };

  rec.onresult = function(e) {
    clearTimeout(micTimer);
    rec.stop();
    const alts = Array.from(e.results[e.results.length - 1])
      .map(function(a) { return a.transcript.trim().toLowerCase(); });
    const target = pendingTargets[currentIndex].word;
    document.getElementById('transcript-box').textContent = '"' + alts[0] + '"';
    const anyMatch = alts.some(function(a) { return fuzzyMatch(a, target).ok; });
    if (anyMatch) {
      markCorrect();
    } else {
      const top = fuzzyMatch(alts[0], target);
      showFeedback(false, top.shortSound
        ? 'I heard something else — try saying just the sound again! 🔊'
        : 'I heard: "' + alts[0] + '". Try again!');
    }
  };

  rec.onerror = function(e) {
    clearTimeout(micTimer);
    micSetIdle();
    if (e.error === 'not-allowed') {
      document.getElementById('transcript-box').textContent =
        'Microphone blocked — please allow mic access in your browser settings.';
    } else if (e.error !== 'no-speech') {
      document.getElementById('transcript-box').textContent = 'Mic error: ' + e.error;
    }
  };

  rec.onend = function() { micSetIdle(); };
  rec.start();
}

document.getElementById('btn-mic').addEventListener('click', function() {
  if (micActive) { micSetIdle(); } else { startListening(); }
});

/* ── WRITING — Tesseract OCR ── */
document.getElementById('btn-camera').addEventListener('click', function() {
  document.getElementById('camera-input').click();
});

document.getElementById('camera-input').addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('ocr-preview').innerHTML =
      '<img src="' + ev.target.result + '" alt="Preview" style="max-height:160px;border-radius:8px" />';
  };
  reader.readAsDataURL(file);
  document.getElementById('ocr-result-box').innerHTML = '<span class="spinner"></span> Reading your writing...';
  document.getElementById('btn-camera').disabled = true;
  try {
    const result  = await Tesseract.recognize(file, 'eng', { logger: function() {} });
    const ocr     = result.data.text.trim();
    const cleaned = ocr.replace(/[^a-zA-Z0-9 .,!?']/g, '').trim().toLowerCase();
    const target  = pendingTargets[currentIndex].word.replace(/[^a-zA-Z0-9 .,!?']/g, '').trim().toLowerCase();
    document.getElementById('ocr-result-box').textContent = 'Detected: "' + ocr + '"';
    if (cleaned.indexOf(target) !== -1) { markCorrect(); }
    else { showFeedback(false, 'Read: "' + ocr.slice(0, 60) + '". Try again!'); }
  } catch(err) {
    document.getElementById('ocr-result-box').textContent = 'OCR error: ' + err.message;
  } finally {
    document.getElementById('btn-camera').disabled = false;
    e.target.value = '';
  }
});

/* ── NAVIGATION ── */
document.querySelectorAll('.level-card').forEach(function(card) {
  card.addEventListener('click', function() {
    openLevel(parseInt(card.dataset.level, 10));
  });
});

document.getElementById('btn-back').addEventListener('click', function() {
  micSetIdle();
  renderDashboard();
  showView('dashboard');
});

document.getElementById('btn-home').addEventListener('click', function() {
  renderDashboard();
  showView('dashboard');
});

document.getElementById('btn-reset-progress').addEventListener('click', function() {
  if (confirm('Reset ALL progress? This cannot be undone.')) {
    progress = defaultProgress();
    saveProgress();
    renderDashboard();
  }
});

/* ── BOOT ── */
renderDashboard();
showView('dashboard');
