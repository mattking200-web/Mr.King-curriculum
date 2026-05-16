/* ═══════════════════════════════════════════════════════════════
   MrKing Curriculum — app.js
   ═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   CURRICULUM DATA
   Level types: 'sounds' | 'names' | 'reading' | 'writing'
   Edit targets arrays freely — the rest is automatic.
   ────────────────────────────────────────────────────────────── */
const CURRICULUM = [
  {
    id: 1,
    title: 'Letter Sounds',
    type: 'sounds',                         // phoneme sounds: /ă/ /ĕ/ /ĭ/ /ŏ/ /ŭ/
    hint: 'Tap the mic and make the sound — not the name!',
    targets: ['a', 'e', 'i', 'o', 'u'],    // ← swap letters here
  },
  {
    id: 2,
    title: 'Letter Names',
    type: 'names',                          // letter names: "ay" "ee" "eye" etc.
    hint: 'Tap the mic and say the letter name.',
    targets: ['a', 'b', 'c', 'd', 'e'],    // ← swap letters here
  },
  {
    id: 3,
    title: 'CVC Words',
    type: 'reading',                        // whole-word speech recognition
    hint: 'Tap the mic and read the word aloud.',
    targets: ['cat', 'dog', 'big', 'sun', 'red'],
  },
  {
    id: 4,
    title: 'Simple Sentences',
    type: 'writing',                        // Tesseract OCR
    hint: 'Write this sentence on paper, then snap a photo.',
    targets: ['The cat sat.', 'I see a dog.', 'The sun is big.'],
  },
];

/* ──────────────────────────────────────────────────────────────
   TEACHING CONTENT
   Keyword: shown in tip and spoken aloud.
   SoundTTS / NameTTS: what the browser says when "Listen" is tapped.
   ────────────────────────────────────────────────────────────── */
const LETTER_DATA = {
  //       keyword      short-sound TTS                               name TTS
  a: { kw: 'Apple',   soundTTS: 'The letter A makes the short ah sound, like Apple.',   nameTTS: 'This is the letter A. Say A.' },
  b: { kw: 'Ball',    soundTTS: 'The letter B makes the buh sound, like Ball.',         nameTTS: 'This is the letter B. Say B.' },
  c: { kw: 'Cat',     soundTTS: 'The letter C makes the kuh sound, like Cat.',          nameTTS: 'This is the letter C. Say C.' },
  d: { kw: 'Dog',     soundTTS: 'The letter D makes the duh sound, like Dog.',          nameTTS: 'This is the letter D. Say D.' },
  e: { kw: 'Elephant',soundTTS: 'The letter E makes the short eh sound, like Elephant.',nameTTS: 'This is the letter E. Say E.' },
  f: { kw: 'Fish',    soundTTS: 'The letter F makes the fff sound, like Fish.',         nameTTS: 'This is the letter F. Say F.' },
  g: { kw: 'Goat',    soundTTS: 'The letter G makes the guh sound, like Goat.',        nameTTS: 'This is the letter G. Say G.' },
  h: { kw: 'Hat',     soundTTS: 'The letter H makes the huh sound, like Hat.',         nameTTS: 'This is the letter H. Say H.' },
  i: { kw: 'Igloo',   soundTTS: 'The letter I makes the short ih sound, like Igloo.',  nameTTS: 'This is the letter I. Say I.' },
  j: { kw: 'Jam',     soundTTS: 'The letter J makes the juh sound, like Jam.',         nameTTS: 'This is the letter J. Say J.' },
  k: { kw: 'Kite',    soundTTS: 'The letter K makes the kuh sound, like Kite.',        nameTTS: 'This is the letter K. Say K.' },
  l: { kw: 'Lion',    soundTTS: 'The letter L makes the lll sound, like Lion.',        nameTTS: 'This is the letter L. Say L.' },
  m: { kw: 'Moon',    soundTTS: 'The letter M makes the mmm sound, like Moon.',        nameTTS: 'This is the letter M. Say M.' },
  n: { kw: 'Nest',    soundTTS: 'The letter N makes the nnn sound, like Nest.',        nameTTS: 'This is the letter N. Say N.' },
  o: { kw: 'Orange',  soundTTS: 'The letter O makes the short oh sound, like Orange.', nameTTS: 'This is the letter O. Say O.' },
  p: { kw: 'Pig',     soundTTS: 'The letter P makes the puh sound, like Pig.',         nameTTS: 'This is the letter P. Say P.' },
  q: { kw: 'Queen',   soundTTS: 'The letter Q makes the kwuh sound, like Queen.',      nameTTS: 'This is the letter Q. Say Q.' },
  r: { kw: 'Rabbit',  soundTTS: 'The letter R makes the rrr sound, like Rabbit.',      nameTTS: 'This is the letter R. Say R.' },
  s: { kw: 'Sun',     soundTTS: 'The letter S makes the sss sound, like Sun.',         nameTTS: 'This is the letter S. Say S.' },
  t: { kw: 'Tree',    soundTTS: 'The letter T makes the tuh sound, like Tree.',        nameTTS: 'This is the letter T. Say T.' },
  u: { kw: 'Umbrella',soundTTS: 'The letter U makes the short uh sound, like Umbrella.',nameTTS:'This is the letter U. Say U.' },
  v: { kw: 'Van',     soundTTS: 'The letter V makes the vvv sound, like Van.',         nameTTS: 'This is the letter V. Say V.' },
  w: { kw: 'Water',   soundTTS: 'The letter W makes the wuh sound, like Water.',       nameTTS: 'This is the letter W. Say W.' },
  x: { kw: 'Box',     soundTTS: 'The letter X makes the ks sound, like Box.',          nameTTS: 'This is the letter X. Say X.' },
  y: { kw: 'Yellow',  soundTTS: 'The letter Y makes the yuh sound, like Yellow.',      nameTTS: 'This is the letter Y. Say Y.' },
  z: { kw: 'Zebra',   soundTTS: 'The letter Z makes the zzz sound, like Zebra.',       nameTTS: 'This is the letter Z. Say Z.' },
};

/* ──────────────────────────────────────────────────────────────
   FUZZY MATCH ALIASES
   SOUND_ALIASES: what the browser hears when student makes a phoneme
   NAME_ALIASES:  what the browser hears when student says a letter name
   ────────────────────────────────────────────────────────────── */
const SOUND_ALIASES = {
  // Short vowel sounds — browser often hears these for phoneme attempts
  'a': ['ah', 'uh', 'aa', 'ha', 'huh'],
  'e': ['eh', 'ef', 'ed', 'et', 'ep'],
  'i': ['ih', 'it', 'is', 'in', 'if'],
  'o': ['aw', 'on', 'ot', 'op'],
  'u': ['uh', 'up', 'us', 'un', 'ugh'],
  // Consonant sounds — add as you expand the curriculum
  'b': ['buh', 'bah', 'ba', 'bub'],
  'c': ['kuh', 'kah', 'ka', 'cuh'],
  'd': ['duh', 'dah', 'da', 'dud'],
  'f': ['fff', 'fuh', 'fah'],
  'g': ['guh', 'gah', 'ga'],
  'h': ['huh', 'hah', 'ha'],
  'j': ['juh', 'jah', 'ja'],
  'k': ['kuh', 'kah', 'ka'],
  'l': ['lll', 'luh', 'la', 'el'],
  'm': ['mmm', 'muh', 'ma', 'em'],
  'n': ['nnn', 'nuh', 'na', 'en'],
  'p': ['puh', 'pah', 'pa'],
  'r': ['rrr', 'ruh', 'ra', 'ar'],
  's': ['sss', 'suh', 'sa', 'es'],
  't': ['tuh', 'tah', 'ta'],
  'v': ['vvv', 'vuh', 'va'],
  'w': ['wuh', 'wah', 'wa'],
};

const NAME_ALIASES = {
  'a': ['ay', 'aye', 'hey', 'eight', 'ate'],
  'b': ['bee', 'be', 'bea', 'beat'],
  'c': ['see', 'sea', 'si', 'cee'],
  'd': ['dee', 'de', 'the'],
  'e': ['ee', 'he', 'me', 'we'],
  'f': ['ef', 'eff', 'off'],
  'g': ['gee', 'ji', 'ge'],
  'h': ['aitch', 'haitch', 'age'],
  'i': ['eye', 'aye', 'ai', 'my', 'hi'],
  'j': ['jay', 'jae', 'je'],
  'k': ['kay', 'cay', 'ke'],
  'l': ['el', 'ell', 'elle'],
  'm': ['em', 'hmm', 'mm'],
  'n': ['en', 'inn', 'and'],
  'o': ['oh', 'owe', 'no', 'go'],
  'p': ['pee', 'pe'],
  'q': ['cue', 'queue', 'kew'],
  'r': ['are', 'ar'],
  's': ['es', 'ess'],
  't': ['tea', 'tee', 'te'],
  'u': ['you', 'yew', 'ewe', 'oo'],
  'v': ['vee', 've'],
  'w': ['double you', 'double u'],
  'x': ['ex', 'eggs'],
  'y': ['why', 'wi', 'wai'],
  'z': ['zee', 'zed'],
};

/* ──────────────────────────────────────────────────────────────
   PERSISTENCE
   ────────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'mrking_v3';

function defaultProgress() {
  var p = {};
  CURRICULUM.forEach(function(lvl) {
    p[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
  });
  return p;
}

function loadProgress() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    var parsed = JSON.parse(raw);
    CURRICULUM.forEach(function(lvl) {
      if (!parsed[lvl.id]) parsed[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
    });
    return parsed;
  } catch(e) { return defaultProgress(); }
}

function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch(e) {}
}

var progress = loadProgress();

/* ──────────────────────────────────────────────────────────────
   VIEW ROUTER
   ────────────────────────────────────────────────────────────── */
function showView(name) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  var el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

/* ──────────────────────────────────────────────────────────────
   DASHBOARD
   ────────────────────────────────────────────────────────────── */
function renderDashboard() {
  var totalQ = 0, totalDone = 0;
  CURRICULUM.forEach(function(lvl) {
    var prog     = progress[lvl.id];
    var unlocked = lvl.id === 1 || progress[lvl.id - 1].completed;
    var pct      = lvl.targets.length ? Math.round((prog.answeredCount / lvl.targets.length) * 100) : 0;
    totalQ    += lvl.targets.length;
    totalDone += prog.answeredCount;

    var card     = document.getElementById('card-level-'   + lvl.id);
    var barFill  = document.getElementById('bar-level-'    + lvl.id);
    var pctEl    = document.getElementById('pct-level-'    + lvl.id);
    var statusEl = document.getElementById('status-level-' + lvl.id);
    if (!card) return;

    barFill.style.width = pct + '%';
    pctEl.textContent   = pct + '%';
    card.classList.toggle('locked',    !unlocked);
    card.classList.toggle('completed', !!prog.completed);
    statusEl.querySelector('.status-icon').textContent =
      prog.completed ? '✅' : unlocked ? '🔓' : '🔒';

    var conn = document.getElementById('connector-' + lvl.id + '-' + (lvl.id + 1));
    if (conn) conn.classList.toggle('active', !!prog.completed);
  });
  var overall = totalQ ? Math.round((totalDone / totalQ) * 100) : 0;
  document.getElementById('overall-mastery-bar').style.width     = overall + '%';
  document.getElementById('overall-mastery-percent').textContent = overall + '%';
}

/* ──────────────────────────────────────────────────────────────
   ASSESSMENT STATE
   ────────────────────────────────────────────────────────────── */
var currentLevel   = null;
var pendingTargets = [];
var currentIndex   = 0;

function openLevel(levelId) {
  var lvl = null;
  for (var i = 0; i < CURRICULUM.length; i++) {
    if (CURRICULUM[i].id === levelId) { lvl = CURRICULUM[i]; break; }
  }
  if (!lvl) return;
  if (lvl.id !== 1 && !progress[lvl.id - 1].completed) return;

  currentLevel = lvl;

  if (progress[lvl.id].completed) {
    progress[lvl.id] = { completed: false, answeredCount: 0, answeredSet: [] };
    saveProgress();
  }

  var done = progress[lvl.id].answeredSet;
  pendingTargets = [];
  for (var j = 0; j < lvl.targets.length; j++) {
    if (done.indexOf(j) === -1) pendingTargets.push({ word: lvl.targets[j], idx: j });
  }

  currentIndex = 0;
  setupAssessmentView();
  showView('assessment');
  loadQuestion();
}

function setupAssessmentView() {
  var lvl = currentLevel;
  var isWriting = lvl.type === 'writing';
  var isSounds  = lvl.type === 'sounds';

  document.getElementById('assess-level-tag').textContent = 'Level ' + lvl.id;

  var typeTag = document.getElementById('assess-type-tag');
  if (isSounds) {
    typeTag.textContent = '🔉 Sounds';
    typeTag.className   = 'tag tag-sounds';
  } else if (lvl.type === 'names') {
    typeTag.textContent = '📖 Names';
    typeTag.className   = 'tag tag-reading';
  } else if (lvl.type === 'reading') {
    typeTag.textContent = '📖 Reading';
    typeTag.className   = 'tag tag-reading';
  } else {
    typeTag.textContent = '✏️ Writing';
    typeTag.className   = 'tag tag-writing';
  }

  document.getElementById('target-hint').textContent = lvl.hint;
  document.getElementById('panel-reading').classList.toggle('hidden', isWriting);
  document.getElementById('panel-writing').classList.toggle('hidden', !isWriting);

  var container = document.getElementById('question-dots');
  container.innerHTML = '';
  var done = progress[lvl.id].answeredSet;
  for (var i = 0; i < lvl.targets.length; i++) {
    var dot = document.createElement('div');
    dot.className = 'dot' + (done.indexOf(i) !== -1 ? ' done' : '');
    dot.id = 'dot-' + i;
    container.appendChild(dot);
  }
}

function loadQuestion() {
  if (currentIndex >= pendingTargets.length) { completeLevel(); return; }

  var item = pendingTargets[currentIndex];

  // Display the letter in UPPERCASE for clarity
  var displayWord = (currentLevel.type === 'sounds' || currentLevel.type === 'names')
    ? item.word.toUpperCase()
    : item.word;
  document.getElementById('target-word-display').textContent = displayWord;

  document.querySelectorAll('.dot').forEach(function(d) { d.classList.remove('current'); });
  var dot = document.getElementById('dot-' + item.idx);
  if (dot) dot.classList.add('current');

  hideFeedback();
  hideTeachingOverlay();
  micSetIdle();
  document.getElementById('transcript-box').innerHTML  = '<em>Tap the mic and speak.</em>';
  document.getElementById('ocr-result-box').innerHTML  = '<em>Photo result will appear here.</em>';
  document.getElementById('ocr-preview').innerHTML     = '';
}

function markCorrect() {
  var item = pendingTargets[currentIndex];
  var prog = progress[currentLevel.id];

  if (prog.answeredSet.indexOf(item.idx) === -1) {
    prog.answeredSet.push(item.idx);
    prog.answeredCount = prog.answeredSet.length;
    saveProgress();
    renderDashboard();
  }

  var dot = document.getElementById('dot-' + item.idx);
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

/* ──────────────────────────────────────────────────────────────
   SIMPLE FEEDBACK OVERLAY  (correct answers & non-letter wrongs)
   ────────────────────────────────────────────────────────────── */
function showFeedback(correct, msg) {
  document.getElementById('feedback-icon').textContent = correct ? '✅' : '❌';
  document.getElementById('feedback-msg').textContent  = msg;
  document.getElementById('feedback-card').classList.toggle('wrong', !correct);
  document.getElementById('btn-next').textContent = correct ? 'Next →' : 'Try Again';
  document.getElementById('feedback-overlay').classList.remove('hidden');
}

function hideFeedback() {
  document.getElementById('feedback-overlay').classList.add('hidden');
}

document.getElementById('btn-next').addEventListener('click', function() {
  var wasCorrect = !document.getElementById('feedback-card').classList.contains('wrong');
  hideFeedback();
  if (wasCorrect) { currentIndex++; loadQuestion(); }
});

/* ──────────────────────────────────────────────────────────────
   TEACHING FEEDBACK OVERLAY
   Shown when a student gets a letter wrong (sounds or names level).
   - Giant letter at 150px
   - Contextual teaching tip
   - "Listen to Me" TTS button
   ────────────────────────────────────────────────────────────── */
function showTeachingFeedback(letter, levelType) {
  var L    = letter.toLowerCase();
  var data = LETTER_DATA[L] || {};
  var kw   = data.kw || '';

  // Giant letter
  document.getElementById('teaching-big-letter').textContent = letter.toUpperCase();

  // Teaching tip text
  var tip = '';
  if (levelType === 'sounds') {
    tip = 'This letter makes the /' + L + '/ sound' + (kw ? ', like ' + kw : '') + '. Try again!';
  } else {
    tip = 'This is the letter ' + letter.toUpperCase() + '. Can you say ' + letter.toUpperCase() + '?';
  }
  document.getElementById('teaching-tip').textContent = tip;

  // Store TTS text for the Listen button
  document.getElementById('teaching-overlay').dataset.tts =
    levelType === 'sounds' ? (data.soundTTS || tip) : (data.nameTTS || tip);

  document.getElementById('teaching-overlay').classList.remove('hidden');
}

function hideTeachingOverlay() {
  document.getElementById('teaching-overlay').classList.add('hidden');
}

document.getElementById('btn-listen').addEventListener('click', function() {
  var text = document.getElementById('teaching-overlay').dataset.tts || '';
  speakText(text);
});

document.getElementById('btn-try-again').addEventListener('click', function() {
  hideTeachingOverlay();
  micSetIdle();
  document.getElementById('transcript-box').innerHTML = '<em>Tap the mic and try again.</em>';
});

/* ──────────────────────────────────────────────────────────────
   SPEECH SYNTHESIS (Text-to-Speech) — zero cost, built into browser
   ────────────────────────────────────────────────────────────── */
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  var utt   = new SpeechSynthesisUtterance(text);
  utt.lang  = 'en-US';
  utt.rate  = 0.85;   // slightly slower for young learners
  utt.pitch = 1.1;
  window.speechSynthesis.speak(utt);
}

/* ──────────────────────────────────────────────────────────────
   FUZZY MATCH
   Selects alias map based on level type, then tests transcript.
   ────────────────────────────────────────────────────────────── */
function fuzzyMatch(transcript, target, levelType) {
  var t   = transcript.trim().toLowerCase();
  var tgt = target.trim().toLowerCase();

  // 1. Exact match
  if (t === tgt) return true;

  // 2. Transcript contains the target as a whole word
  if (new RegExp('\\b' + tgt + '\\b', 'i').test(t)) return true;

  // 3. Level-specific alias map
  var aliases = (levelType === 'sounds') ? (SOUND_ALIASES[tgt] || []) : (NAME_ALIASES[tgt] || []);
  for (var i = 0; i < aliases.length; i++) {
    if (t === aliases[i] || t.indexOf(aliases[i]) !== -1) return true;
  }

  return false;
}

/* ──────────────────────────────────────────────────────────────
   SCORE A TRANSCRIPT
   Called with isFinal=false for interim results (good for short sounds),
   isFinal=true when the browser considers the utterance complete.
   ────────────────────────────────────────────────────────────── */
var micScored = false;

function scoreTranscript(rec, transcript, isFinal) {
  if (micScored) return;

  var target    = pendingTargets[currentIndex].word;
  var levelType = currentLevel.type;
  var matched   = fuzzyMatch(transcript, target, levelType);

  // Show live transcript so student can see what was heard
  document.getElementById('transcript-box').textContent = '"' + transcript + '"';

  if (matched) {
    micScored = true;
    clearTimeout(micTimer);
    rec.stop();
    markCorrect();
    return;
  }

  // Only show wrong feedback on a FINAL result
  if (isFinal) {
    micScored = true;
    clearTimeout(micTimer);
    rec.stop();

    if (levelType === 'sounds' || levelType === 'names') {
      // Letter levels → rich teaching overlay
      showTeachingFeedback(target, levelType);
    } else {
      // CVC / reading → simple overlay
      showFeedback(false, 'I heard: "' + transcript + '". Try again!');
    }
  }
}

/* ──────────────────────────────────────────────────────────────
   SPEECH RECOGNITION (microphone)
   ────────────────────────────────────────────────────────────── */
var micActive = false;
var micTimer  = null;

function micSetActive() {
  micActive = true;
  var btn = document.getElementById('btn-mic');
  btn.classList.add('active');
  btn.querySelector('.btn-label').textContent = 'Listening… tap to stop';
}

function micSetIdle() {
  micActive = false;
  clearTimeout(micTimer);
  var btn = document.getElementById('btn-mic');
  if (!btn) return;
  btn.classList.remove('active');
  btn.querySelector('.btn-label').textContent = 'Tap to Read Aloud';
}

function startListening() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('transcript-box').textContent =
      'Speech recognition not available. Please use Chrome on Android or desktop Chrome.';
    return;
  }

  micScored = false;
  var rec = new SR();
  rec.lang            = 'en-US';
  rec.continuous      = true;    // don't auto-stop; we stop after a result
  rec.interimResults  = true;    // fire events for partial speech — vital for short sounds
  rec.maxAlternatives = 1;

  rec.onstart = function() {
    micSetActive();
    document.getElementById('transcript-box').innerHTML =
      '<em>🎙️ Listening — say it now!</em>';
    micTimer = setTimeout(function() {
      if (!micScored) {
        rec.stop();
        document.getElementById('transcript-box').innerHTML =
          '<em>Nothing heard — tap the mic and try again.</em>';
      }
    }, 8000);
  };

  rec.onresult = function(e) {
    var latest     = e.results[e.results.length - 1];
    var transcript = latest[0].transcript.trim().toLowerCase();
    var isFinal    = latest.isFinal;
    scoreTranscript(rec, transcript, isFinal);
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

/* ──────────────────────────────────────────────────────────────
   WRITING — Tesseract OCR
   ────────────────────────────────────────────────────────────── */
document.getElementById('btn-camera').addEventListener('click', function() {
  document.getElementById('camera-input').click();
});

document.getElementById('camera-input').addEventListener('change', async function(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('ocr-preview').innerHTML =
      '<img src="' + ev.target.result + '" alt="Preview" style="max-height:160px;border-radius:8px" />';
  };
  reader.readAsDataURL(file);

  document.getElementById('ocr-result-box').innerHTML =
    '<span class="spinner"></span> Reading your writing...';
  document.getElementById('btn-camera').disabled = true;

  try {
    var result  = await Tesseract.recognize(file, 'eng', { logger: function() {} });
    var ocr     = result.data.text.trim();
    var cleaned = ocr.replace(/[^a-zA-Z0-9 .,!?']/g, '').trim().toLowerCase();
    var target  = pendingTargets[currentIndex].word
                    .replace(/[^a-zA-Z0-9 .,!?']/g, '').trim().toLowerCase();

    document.getElementById('ocr-result-box').textContent = 'Detected: "' + ocr + '"';

    if (cleaned.indexOf(target) !== -1) {
      markCorrect();
    } else {
      showFeedback(false, 'Read: "' + ocr.slice(0, 60) + '". Try again!');
    }
  } catch(err) {
    document.getElementById('ocr-result-box').textContent = 'OCR error: ' + err.message;
  } finally {
    document.getElementById('btn-camera').disabled = false;
    e.target.value = '';
  }
});

/* ──────────────────────────────────────────────────────────────
   NAVIGATION
   ────────────────────────────────────────────────────────────── */
document.querySelectorAll('.level-card').forEach(function(card) {
  card.addEventListener('click', function() {
    openLevel(parseInt(card.dataset.level, 10));
  });
});

document.getElementById('btn-back').addEventListener('click', function() {
  micSetIdle();
  window.speechSynthesis && window.speechSynthesis.cancel();
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

/* ──────────────────────────────────────────────────────────────
   BOOT
   ────────────────────────────────────────────────────────────── */
renderDashboard();
showView('dashboard');
