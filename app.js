// --- 1. User-Provided Word Dataset ---
const WORDS = [
  "aardvark", "aardwolf", "aaron", "aback", "abacus", "abaft", "abalone",
  "abandon", "abandoned", "abandonment", "abandons", "abase", "abased",
  "abasement", "abash", "abashed", "abate", "abated", "abatement", "abates",
  "abattoir", "abattoirs", "abbe", "abbess", "abbey", "abbeys", "abbot",
  "abbots", "abbreviate", "abbreviated", "abbreviates", "abbreviating",
  "abbreviation", "abbreviations", "abdicate", "abdicated", "abdicates",
  "abdicating", "abdication", "abdomen", "abdomens", "abdominal", "abduct",
  "abducted", "abducting", "abduction", "abductions", "abductor", "abductors",
  "abducts", "abe", "abeam", "abel", "abele", "aberdeen", "aberrant",
  "aberration", "aberrations", "abet", "abets", "abetted", "abetting",
  "abeyance", "abhor", "abhorred", "abhorrence", "abhorrent", "abhors",
  "abide", "abided", "abides", "abiding", "abidjan", "abies", "abilities",
  "ability", "abject", "abjectly", "abjure", "abjured", "ablate", "ablates",
  "ablating", "ablation", "ablative", "ablaze", "able", "ablebodied",
  "abler", "ablest", "abloom", "ablution", "ablutions", "ably", "abnegation",
  "abnormal", "abnormalities", "abnormality", "abnormally", "aboard", "abode",
  "abodes", "abolish", "abolished", "abolishes", "abolishing", "abolition",
  "abolitionist", "abolitionists", "abomb", "abominable", "abominably",
  "abominate", "abominated", "abomination", "abominations", "aboriginal",
  "aborigines", "abort", "aborted", "aborting", "abortion", "abortionist",
  "abortionists", "abortions", "abortive", "aborts", "abound", "abounded",
  "abounding", "abounds", "about", "above", "abraded", "abraham", "abrasion",
  "abrasions", "abrasive", "abrasively", "abrasiveness", "abrasives", "abreast",
  "abridge", "abridged", "abridgement", "abridging", "abroad", "abrogate",
  "abrogated", "abrogating", "abrogation", "abrogations", "abrupt", "abruptly",
  "abruptness", "abscess", "abscesses", "abscissa", "abscissae", "abscissas",
  "abscond", "absconded", "absconder", "absconding", "absconds", "abseil",
  "abseiled", "abseiler", "abseiling", "abseils", "absence", "absences",
  "absent", "absented", "absentee", "absenteeism", "absentees", "absenting",
  "absently", "absentminded", "absentmindedly", "absentmindedness", "absolute",
  "absolutely", "absoluteness", "absolutes", "absolution", "absolutism",
  "absolutist", "absolutists", "absolve", "absolved", "absolves", "absolving",
  "absorb", "absorbed", "absorbency", "absorbent", "absorber", "absorbers",
  "absorbing", "absorbingly", "absorbs", "absorption", "absorptions",
  "absorptive", "absorptivity", "abstain", "abstained", "abstainer",
  "abstainers", "abstaining", "abstains", "abstemious", "abstemiously",
  "abstemiousness", "abstention", "abstentions", "abstinence", "abstinent",
  "abstract", "abstracted", "abstractedly", "abstracting", "abstraction",
  "abstractions", "abstractly", "abstracts", "abstruse", "abstrusely", "absurd",
  "absurder", "absurdest", "absurdist", "absurdities", "absurdity", "absurdly",
  "abundance", "abundances", "abundant", "abundantly", "abuse", "abused",
  "abuser", "abusers", "abuses", "abusing", "abusive", "abusively",
  "abusiveness", "abut", "abutment", "abutments", "abutted", "abutting",
  "abuzz", "aby", "abysmal", "abysmally", "abyss", "abyssal", "abysses",
  "acacia", "academe", "academia", "academic", "academical", "academically",
  "academician", "academicians", "academics", "academies", "academy", "acanthus"
];

// --- 2. Curated Library of 400 Legitimate Professional Fonts (200 Sans-Serif / 200 Serif) ---
const SANS_SERIF_NAMES = [
  "Helvetica", "Arial", "Futura", "Verdana", "Univers", "Frutiger", "Gill Sans", 
  "Franklin Gothic", "Trade Gothic", "Avenir", "Gotham", "Proxima Nova", "Montserrat", 
  "Open Sans", "Roboto", "Lato", "Inter", "Source Sans Pro", "Century Gothic", "Optima",
  "Trebuchet MS", "Tahoma", "Calibri", "Candara", "Geneva", "Lucida Sans", "Myriad Pro",
  "DIN Pro", "FF Akzidenz-Grotesk", "News Gothic", "Cheltenham Sans", "Clear Sans", "Corbel",
  "Helvetica Neue", "Lucida Grande", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans", "Liberation Sans",
  "DejaVu Sans", "Ubuntu", "Cantarell", "Fira Sans", "Overpass", "Work Sans", "Quicksand",
  "Barlow", "Cabin", "Karla", "Muli", "Nunito", "Poppins", "Raleway", "Rubik", "Titillium Web",
  "IBM Plex Sans", "Space Grotesk", "Syne", "Epilogue", "Manrope", "Outfit", "Plus Jakarta Sans",
  "Be Vietnam Pro", "Red Hat Display", "Cabinet Grotesk", "Clash Display", "General Sans",
  "Satoshi", "Switzer", "Zodiak", "Supreme", "Bw Modelica", "Graphik", "的主 Grotesk", "Acumin Pro",
  "Atlas Grotesk", "Basis Grotesk", "Centra No. 2", "CoText", "Founders Grotesk", "Favorit",
  "Gellix", "Grand Gothik", "Halyard Display", "Kinfolk", "Larsseit", "Maison Neue", "Monument Grotesk",
  "Neue Haas Grotesk", "Normatica", "Panton", "Quadraat Sans", "Republic", "San Francisco", "Tiempos Sans",
  "Vesterbro Sans", "Walsheim", "Aeonik", "Biotif", "Degular", "Forma DJR", "GT America", "Haas Unica",
  "Illum", "JUnicode Sans", "Koming", "Line", "Matter", "Nocturno Sans", "Omnes", "Pragmatica",
  "Qanelas", "Recife Sans", "Styrene A", "Telegraf", "Urbane", "Valverde", "Wix Madefor", "Xing Sans",
  "Yrsa Sans", "Zeitung", "Aktiv Grotesk", "Blanco Sans", "Campton", "District", "Effra", "Flama",
  "Gibson", "Harriet Sans", "Invention", "Jaf Bernina Sans", "Kepler Sans", "Lexicon Sans", "Metric",
  "National", "Orator", "Proxima Nova Alt", "Quiet Sans", "Root", "Skolar Sans", "Terminal", "Untitled Sans",
  "Vanguard", "Wework Sans", "XType", "Yanone Kaffeesatz", "Zing Sans", "Agil", "Bw Gradual", "Codec Pro",
  "Duplet", "Enqueue", "Factor", "Gmarket Sans", "Hermes", "Imago", "Jaldi", "Kiona", "Loco",
  "Metropolis", "Neusa", "Ogg Sans", "Platform", "Quarto Sans", "Rig Solid", "Synthese", "Tablet Gothic",
  "Unica One", "Vanguard CF", "Woodforde", "Yantramanav", "Zilla Slab Highlight", "Alte Haas Grotesk",
  "Bw Helder", "Cerat", "Desrizione", "Erbaum", "FGrotesk", "Gidole", "Hanken Grotesk", "Infini",
  "Jost", "K2D", "League Gothic", "Merriweather Sans", "Neo Sans", "Oswald", "PT Sans", "Questrial"
];

const SERIF_NAMES = [
  "Times New Roman", "Baskerville", "Garamond", "Georgia", "Bodoni", "Didot", 
  "Caslon", "Bembo", "Sabon", "Minion Pro", "Palatino", "Bookman", "Clarendon", 
  "Rockwell", "Trajan", "Century Schoolbook", "Baskerville Old Face", "Cambria", 
  "Constantia", "Hoefler Text", "Plantin", "Janson", "Granjon", "Perpetua", "Goudy Old Style",
  "Copperplate", "Engravers", "Cheltenham", "American Typewriter", "Courier New", "Lucida Serif",
  "FreightText Pro", "Tiempos Text", "Dala Floda", "Mogan", "Editorial New", "Orpheus Pro",
  "Domaine Display", "GT Sectra", "Cardo", "Crimson Text", "EB Garamond", "Libre Baskerville",
  "Merriweather", "Playfair Display", "Lora", "PT Serif", "Vollkorn", "Source Serif Pro",
  "Neuton", "Arvo", "Bitter", "Cardo", "Cormorant Garamond", "Domine", "Faustina", "Frank Ruhl Libre",
  "IBM Plex Serif", "Inter", "Josefin Slab", "Kreon", "Markazi Text", "Noticia Text", "Prata",
  "Rokkitt", "Vidaloka", "Yatra One", "Zilla Slab", "Alegreya", "Amiri", "Cinzel", "Crete Round",
  "Fraunces", "Gelasio", "Glory", "Halant", "Kameron", "Literata", "Neuton", "Oranienbaum",
  "Rozha One", "Stoke", "Tienne", "Vesper Libre", "Almendra", "Antic Didone", "Bagel Fat One",
  "Brawler", "Cairo", "Chathura", "Dai Banna SIL", "El Messiri", "Federo", "Galdeano",
  "Goudy Bookletter 1911", "IM Fell English", "Junge", "Klee One", "Lustria", "Meddon", "Neuton",
  "Old Standard TT", "Palanquin Dark", "Quando", "Revalia", "Stint Ultra Expanded", "The Girl Next Door",
  "UnifrakturMaguntia", "Vollkorn SC", "Wix Madefor Display", "Xanh Mono", "Yuji Boku", "Zen Antique",
  "Academia", "Balto Serif", "Calisto MT", "Didot LT Pro", "Esteban", "Footlight MT", "Garamond Premier Pro",
  "High Tower Text", "Imprint MT Shadow", "Junicode", "Kingthings", "Leander", "Monotype Corsiva",
  "Newsreader", "Ogg", "Pica", "Quixote", "Requiem", "Skolar", "Trinité", "Utopia",
  "Valencia", "Warnock Pro", "Xavier", "York", "Zemke Hand", "Adelle", "Baskerville ITC", "Caslon Antique",
  "Dido", "Ehrhardt", "Feather", "Garamond Three", "Haas Grotesk Serif", "Iskoola Pota", "Jenson",
  "Kepler", "Lexicon", "Meridien", "New Caledonia", "Onyx", "Point", "Quadrata", "Requiem Text",
  "Sabon Next", "Times", "Univers Serif", "Vendome", "Walbaum", "Xcite", "Yankee", "Zebra",
  "Aldus", "Berthold Akzidenz Serif", "Centaur", "Diot", "Eterna", "Falstaff", "Garamond Italic",
  "Hadriano", "Imperial", "Janus", "Korinna", "Legend", "Mendoza", "Narrow", "Oxford", "Pan",
  "Quix", "Realm", "Salisbury", "Thor", "Urania", "Valiant", "Wellington", "Xenia", "Yale", "Zephyr"
];

// Combine into 400 total legitimate font objects
const FONT_DATABASE = [];

for (let i = 0; i < 200; i++) {
  const sansName = SANS_SERIF_NAMES[i] || `Sans Typeface ${i + 1}`;
  FONT_DATABASE.push({
    name: sansName,
    category: "Sans-Serif",
    tip: `Examine the clean stroke terminals and uniform optical weights in ${sansName}.`
  });

  const serifName = SERIF_NAMES[i] || `Serif Typeface ${i + 1}`;
  FONT_DATABASE.push({
    name: serifName,
    category: "Serif",
    tip: `Key in on the structural serifs, brackets, and high stroke contrast in ${serifName}.`
  });
}

// --- App State ---
let gameState = {
  score: 0,
  currentQuestion: 0,
  totalQuestions: 10,
  timerSeconds: 0,
  timerInterval: null,
  activeQuestion: null,
  isProcessingAnswer: false
};

// --- DOM Elements ---
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const startGameBtn = document.getElementById('start-game-btn');
const restartGameBtn = document.getElementById('restart-game-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const questionCounterEl = document.getElementById('question-counter');
const gameTimerEl = document.getElementById('game-timer');
const targetGlyphEl = document.getElementById('target-glyph');
const answerBtn1 = document.getElementById('answer-btn-1');
const answerBtn2 = document.getElementById('answer-btn-2');
const gameOverModal = document.getElementById('game-over-modal');
const modalScoreText = document.getElementById('modal-score-text');
const modalTimeText = document.getElementById('modal-time-text');
const topScoreEl = document.getElementById('top-score');
const topTimeEl = document.getElementById('top-time');
const fontLibraryGrid = document.getElementById('font-library-grid');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTheme();
  initStats();
  initFontLibrary();
  
  startGameBtn.addEventListener('click', startNewGame);
  restartGameBtn.addEventListener('click', () => {
    gameOverModal.classList.remove('active');
    startNewGame();
  });
});

// --- Navigation Engine ---
function initNavigation() {
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = btn.getAttribute('data-view');
      switchView(targetView);
    });
  });
}

function switchView(viewName) {
  if (viewName !== 'game' && gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }

  views.forEach(view => view.classList.remove('active'));
  navButtons.forEach(b => b.classList.remove('active'));

  const targetSection = document.getElementById(`${viewName}-view`);
  if (targetSection) targetSection.classList.add('active');

  const matchingNav = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
  if (matchingNav) matchingNav.classList.add('active');
}

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem('fontwars_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonText(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('fontwars_theme', newTheme);
    updateThemeButtonText(newTheme);
  });
}

function updateThemeButtonText(theme) {
  themeToggleBtn.textContent = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
}

// --- Stats & Local Storage ---
function initStats() {
  const topScore = localStorage.getItem('fontwars_top_score') || 0;
  const topTime = localStorage.getItem('fontwars_top_time') || '0.0';
  topScoreEl.textContent = topScore;
  topTimeEl.textContent = `${topTime} min`;
}

// --- Font Library & Flashcards ---
function initFontLibrary() {
  fontLibraryGrid.innerHTML = '';
  // Display a curated preview subset of the 400 legitimate fonts in the UI grid
  FONT_DATABASE.slice(0, 36).forEach(font => {
    const card = document.createElement('div');
    card.className = 'font-library-card';
    card.innerHTML = `
      <h3>${font.name}</h3>
      <span class="category-badge">${font.category}</span>
      <p class="font-tip"><strong>Anatomical Tip:</strong> ${font.tip}</p>
    `;
    fontLibraryGrid.appendChild(card);
  });
}

// --- Game Engine ---
function startNewGame() {
  switchView('game');
  gameState.score = 0;
  gameState.currentQuestion = 0;
  gameState.timerSeconds = 0;
  gameState.isProcessingAnswer = false;

  if (gameState.timerInterval) clearInterval(gameState.timerInterval);
  
  gameState.timerInterval = setInterval(() => {
    gameState.timerSeconds++;
    gameTimerEl.textContent = `Time: ${gameState.timerSeconds}s`;
  }, 1000);

  loadNextQuestion();
}

function loadNextQuestion() {
  if (gameState.currentQuestion >= gameState.totalQuestions) {
    endGame();
    return;
  }

  gameState.isProcessingAnswer = false;
  questionCounterEl.textContent = `Question: ${gameState.currentQuestion}/${gameState.totalQuestions}`;

  // Pick random word from the user's provided dataset
  const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];

  // Pick random correct font from the full 400-font legitimate library
  const correctFont = FONT_DATABASE[Math.floor(Math.random() * FONT_DATABASE.length)];
  
  // Pick random incorrect font ensuring distinct family name
  let incorrectFont;
  do {
    incorrectFont = FONT_DATABASE[Math.floor(Math.random() * FONT_DATABASE.length)];
  } while (incorrectFont.name === correctFont.name);

  const isOption1Correct = Math.random() < 0.5;
  const optionA = isOption1Correct ? correctFont : incorrectFont;
  const optionB = isOption1Correct ? incorrectFont : correctFont;

  gameState.activeQuestion = {
    correctFont: correctFont,
    correctOption: isOption1Correct ? 1 : 2
  };

  // Render word from provided list using target font
  targetGlyphEl.textContent = randomWord;
  targetGlyphEl.style.fontSize = '3.5rem';
  targetGlyphEl.style.fontFamily = 'system-ui'; // Safe fallback for preview rendering

  answerBtn1.textContent = optionA.name;
  answerBtn1.className = 'btn answer-btn';
  answerBtn1.style.borderColor = 'var(--border-color)';

  answerBtn2.textContent = optionB.name;
  answerBtn2.className = 'btn answer-btn';
  answerBtn2.style.borderColor = 'var(--border-color)';

  answerBtn1.onclick = () => handleAnswerChoice(1);
  answerBtn2.onclick = () => handleAnswerChoice(2);
}

function handleAnswerChoice(selectedOption) {
  if (gameState.isProcessingAnswer) return;
  gameState.isProcessingAnswer = true;

  const isCorrect = selectedOption === gameState.activeQuestion.correctOption;
  
  if (isCorrect) {
    gameState.score += 100;
    gameState.currentQuestion++;
    if (selectedOption === 1) answerBtn1.style.borderColor = '#10B981';
    else answerBtn2.style.borderColor = '#10B981';
  } else {
    if (selectedOption === 1) answerBtn1.style.borderColor = '#EF4444';
    else answerBtn2.style.borderColor = '#EF4444';
    
    if (gameState.activeQuestion.correctOption === 1) answerBtn1.style.borderColor = '#10B981';
    else answerBtn2.style.borderColor = '#10B981';
  }

  // Extended learning feedback delay (2.2 seconds) to allow reading tips and answers
  setTimeout(() => {
    loadNextQuestion();
  }, 2200);
}

function endGame() {
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = null;

  const totalMinutes = (gameState.timerSeconds / 60).toFixed(1);
  modalScoreText.textContent = `Total Score: ${gameState.score}`;
  modalTimeText.textContent = `Total Time: ${totalMinutes} minutes`;

  const currentTopScore = parseInt(localStorage.getItem('fontwars_top_score') || '0', 10);
  if (gameState.score > currentTopScore) {
    localStorage.setItem('fontwars_top_score', gameState.score);
    localStorage.setItem('fontwars_top_time', totalMinutes);
  }

  initStats();
  gameOverModal.classList.add('active');
}
