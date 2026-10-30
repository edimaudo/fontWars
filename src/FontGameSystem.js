export const SESSION_ROUNDS = 10;
export const LEARNING_PAUSE_MS = 2500;
const HIGH_SCORE_KEY = 'font-wars-high-scores-v2';
const LEGACY_HIGH_SCORE_KEY = 'font-wars-high-scores-v1';

export const GAME_MODES = Object.freeze({
  CLASSIFICATION: 'CLASSIFICATION',
  DUEL: 'DUEL',
});

const DIFFICULTY_RULES = Object.freeze({
  EASY: Object.freeze({
    allowedTiers: [1],
    points: 75,
    specimenMode: 'word',
    minWordLength: 3,
    maxWordLength: 6,
    specimenFontSize: 224,
    duelFontSize: 74,
  }),
  STANDARD: Object.freeze({
    allowedTiers: [1, 2, 3],
    points: 100,
    specimenMode: 'word',
    minWordLength: 7,
    maxWordLength: 12,
    specimenFontSize: 184,
    duelFontSize: 67,
  }),
  EXPERT: Object.freeze({
    allowedTiers: [3],
    points: 150,
    specimenMode: 'glyph-study',
    specimenText: 'Hamburgefontsiv\nAaGgRr 0123456789',
    specimenFontSize: 104,
    duelFontSize: 48,
  }),
});

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function compareScores(a, b) {
  return b.score - a.score || b.accuracy - a.accuracy || a.durationMs - b.durationMs;
}

export class FontGameSystem {
  constructor(app) {
    this.app = app;
    this.fonts = [];
    this.words = [];
    this.roundFonts = [];
    this.roundPairs = [];
    this.roundIndex = 0;
    this.score = 0;
    this.correct = 0;
    this.answerLocked = false;
    this.sessionStartedAt = 0;
    this.rules = DIFFICULTY_RULES.STANDARD;
    this.gameMode = GAME_MODES.CLASSIFICATION;
    this.nextRoundTimer = null;
    this.sessionToken = 0;
  }

  async initialize() {
    const base = import.meta.env.BASE_URL || '/';
    const [fontResponse, wordResponse] = await Promise.all([
      fetch(`${base}data/fonts.json`, { cache: 'no-cache' }),
      fetch(`${base}data/words.json`, { cache: 'no-cache' }),
    ]);
    if (!fontResponse.ok || !wordResponse.ok) {
      throw new Error(`Unable to load game data (fonts: ${fontResponse.status}, words: ${wordResponse.status}).`);
    }
    const [fontData, wordData] = await Promise.all([fontResponse.json(), wordResponse.json()]);
    this.fonts = Array.isArray(fontData.fonts) ? fontData.fonts : [];
    this.words = Array.isArray(wordData.words) ? wordData.words : [];

    const serifCount = this.fonts.filter((font) => font.category === 'Serif').length;
    const sansCount = this.fonts.filter((font) => font.category === 'Sans-Serif').length;
    const idsUnique = new Set(this.fonts.map((font) => font.id)).size === this.fonts.length;
    const namesUnique = new Set(this.fonts.map((font) => font.name.toLocaleLowerCase())).size === this.fonts.length;
    const recordsComplete = this.fonts.every((font) => (
      font.id && font.name && font.familyPageUrl && font.provider === 'Google Fonts'
      && font.anatomicalTip && font.anatomicalFocus
      && [1, 2, 3].includes(font.challengeTier)
    ));
    if (
      this.fonts.length !== 400 || serifCount !== 200 || sansCount !== 200
      || this.words.length < 20 || !idsUnique || !namesUnique || !recordsComplete
    ) {
      throw new Error('Font Wars data validation failed. Expected 400 unique Google Fonts families, 200 per category, with complete learning metadata.');
    }
  }

  async start() {
    const sessionToken = ++this.sessionToken;
    if (this.nextRoundTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.nextRoundTimer);
      this.nextRoundTimer = null;
    }
    this.roundIndex = 0;
    this.score = 0;
    this.correct = 0;
    this.answerLocked = true;
    this.sessionStartedAt = 0;
    this.gameMode = this.app.settings.gameMode === GAME_MODES.DUEL
      ? GAME_MODES.DUEL
      : GAME_MODES.CLASSIFICATION;
    this.rules = DIFFICULTY_RULES[this.app.settings.difficulty] || DIFFICULTY_RULES.STANDARD;
    this.roundFonts = [];
    this.roundPairs = [];
    this.app.views.transition('GAME_LOOP');
    this.app.showPreparingState(this.app.settings.difficulty, this.gameMode);

    try {
      if (this.gameMode === GAME_MODES.DUEL) {
        this.roundPairs = await this.prepareDuelPairs();
      } else {
        this.roundFonts = await this.prepareClassificationFonts();
      }
      if (sessionToken !== this.sessionToken) return false;

      this.roundIndex = 0;
      this.answerLocked = false;
      this.sessionStartedAt = Date.now();
      this.showRound();
      return true;
    } catch (error) {
      if (sessionToken !== this.sessionToken) return false;
      this.answerLocked = true;
      this.app.showFontPreparationError(error.message);
      return false;
    }
  }

  cancel() {
    this.sessionToken += 1;
    if (this.nextRoundTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.nextRoundTimer);
      this.nextRoundTimer = null;
    }
    this.answerLocked = true;
    this.app.views.transition('LANDING');
  }

  async prepareClassificationFonts() {
    const selectedFonts = [];
    for (const category of ['Serif', 'Sans-Serif']) {
      const candidates = shuffle(this.fonts.filter((font) => (
        font.category === category && this.rules.allowedTiers.includes(font.challengeTier)
      )));
      const available = [];

      while (available.length < SESSION_ROUNDS / 2 && candidates.length) {
        const batch = candidates.splice(0, 6);
        const checks = await Promise.all(batch.map(async (font) => ({
          font,
          available: await this.app.loadFontFamily(font.name),
        })));
        for (const result of checks) {
          if (result.available && available.length < SESSION_ROUNDS / 2) available.push(result.font);
        }
      }

      if (available.length < SESSION_ROUNDS / 2) {
        throw new Error(`Only ${available.length} verified ${category} typefaces could be loaded. Five are required for a session.`);
      }
      selectedFonts.push(...available);
    }
    return shuffle(selectedFonts);
  }

  buildDuelCandidates() {
    const candidates = this.fonts.filter((font) => this.rules.allowedTiers.includes(font.challengeTier));
    const groups = new Map();
    for (const font of candidates) {
      const key = `${font.category}|${font.challengeTier}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(font);
    }

    const pairs = [];
    for (const group of groups.values()) {
      const shuffled = shuffle(group);
      for (let index = 0; index + 1 < shuffled.length; index += 2) {
        pairs.push([shuffled[index], shuffled[index + 1]]);
      }
    }
    return shuffle(pairs);
  }

  async prepareDuelPairs() {
    const candidates = this.buildDuelCandidates();
    const verifiedPairs = [];

    while (verifiedPairs.length < SESSION_ROUNDS && candidates.length) {
      const batch = candidates.splice(0, 4);
      const checks = await Promise.all(batch.map(async ([first, second]) => {
        const [firstAvailable, secondAvailable] = await Promise.all([
          this.app.loadFontFamily(first.name),
          this.app.loadFontFamily(second.name),
        ]);
        return firstAvailable && secondAvailable ? [first, second] : null;
      }));
      for (const pair of checks) {
        if (pair && verifiedPairs.length < SESSION_ROUNDS) verifiedPairs.push(pair);
      }
    }

    if (verifiedPairs.length < SESSION_ROUNDS) {
      throw new Error(`Only ${verifiedPairs.length} verified typeface pairs could be loaded. Ten pairs are required for a Duel session.`);
    }

    return shuffle(verifiedPairs.slice(0, SESSION_ROUNDS)).map(([first, second]) => {
      const left = Math.random() < 0.5 ? first : second;
      const right = left.id === first.id ? second : first;
      const target = Math.random() < 0.5 ? left : right;
      return { left, right, target };
    });
  }

  createSpecimenText() {
    if (this.rules.specimenMode === 'glyph-study') return this.rules.specimenText;
    const candidates = this.words.filter((word) => (
      word.length >= this.rules.minWordLength && word.length <= this.rules.maxWordLength
    ));
    const pool = candidates.length ? candidates : this.words;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  showRound() {
    this.answerLocked = false;
    if (this.gameMode === GAME_MODES.DUEL) {
      const pair = this.roundPairs[this.roundIndex];
      if (!pair) return;
      this.app.renderDuelRound({
        ...pair,
        word: this.createSpecimenText(),
        number: this.roundIndex + 1,
        total: SESSION_ROUNDS,
        score: this.score,
        specimenFontSize: this.rules.duelFontSize,
        difficulty: this.app.settings.difficulty,
      });
      return;
    }

    const font = this.roundFonts[this.roundIndex];
    if (!font) return;
    this.app.renderRound({
      font,
      word: this.createSpecimenText(),
      number: this.roundIndex + 1,
      total: SESSION_ROUNDS,
      score: this.score,
      specimenFontSize: this.rules.specimenFontSize,
      difficulty: this.app.settings.difficulty,
    });
  }

  answer(category) {
    if (this.answerLocked || this.gameMode !== GAME_MODES.CLASSIFICATION) return;
    const font = this.roundFonts[this.roundIndex];
    if (!font) return;
    this.submitAnswer({
      isCorrect: category === font.category,
      chosen: category,
      correctAnswer: font.category,
      feedback: {
        chosen: category,
        correctCategory: font.category,
        fontName: font.name,
        tip: font.anatomicalTip,
        focus: font.anatomicalFocus,
      },
    });
  }

  answerDuel(side) {
    if (this.answerLocked || this.gameMode !== GAME_MODES.DUEL) return;
    if (!['LEFT', 'RIGHT'].includes(side)) return;
    const pair = this.roundPairs[this.roundIndex];
    if (!pair) return;
    const chosenFont = side === 'LEFT' ? pair.left : pair.right;
    this.submitAnswer({
      isCorrect: chosenFont.id === pair.target.id,
      chosen: side,
      correctAnswer: pair.target.id === pair.left.id ? 'LEFT' : 'RIGHT',
      feedback: {
        chosen: side,
        correctSide: pair.target.id === pair.left.id ? 'LEFT' : 'RIGHT',
        targetName: pair.target.name,
        otherName: pair.target.id === pair.left.id ? pair.right.name : pair.left.name,
        tip: pair.target.anatomicalTip,
        focus: pair.target.anatomicalFocus,
      },
    });
  }

  submitAnswer({ isCorrect, chosen, correctAnswer, feedback }) {
    if (this.answerLocked) return;
    this.answerLocked = true;
    if (isCorrect) {
      this.correct += 1;
      this.score += this.rules.points;
    }

    this.app.playFeedback(isCorrect);
    this.app.pulseHaptics(isCorrect);
    if (this.gameMode === GAME_MODES.DUEL) {
      this.app.showDuelFeedback({
        ...feedback,
        chosen,
        correctAnswer,
        isCorrect,
        score: this.score,
      });
    } else {
      this.app.showAnswerFeedback({
        ...feedback,
        chosen,
        correctCategory: correctAnswer,
        isCorrect,
        score: this.score,
      });
    }

    const sessionToken = this.sessionToken;
    this.nextRoundTimer = window.setTimeout(() => {
      if (sessionToken !== this.sessionToken) return;
      this.nextRoundTimer = null;
      if (this.roundIndex < SESSION_ROUNDS - 1) {
        this.roundIndex += 1;
        this.showRound();
      } else {
        this.finish();
      }
    }, LEARNING_PAUSE_MS);
  }

  finish() {
    const accuracy = Math.round((this.correct / SESSION_ROUNDS) * 100);
    const record = {
      score: this.score,
      correct: this.correct,
      total: SESSION_ROUNDS,
      accuracy,
      difficulty: this.app.settings.difficulty,
      gameMode: this.gameMode,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - this.sessionStartedAt,
    };
    const allScores = this.readHighScores();
    const scope = (item) => item.gameMode === record.gameMode && item.difficulty === record.difficulty;
    const scopedScores = [...allScores.filter(scope), record].sort(compareScores).slice(0, 5);
    const retainedScores = [
      ...allScores.filter((item) => !scope(item)),
      ...scopedScores,
    ];
    this.saveHighScores(retainedScores);
    this.app.renderGameOver(record, scopedScores);
    this.app.views.transition('GAME_OVER');
  }

  readHighScores() {
    try {
      const current = localStorage.getItem(HIGH_SCORE_KEY);
      if (current) {
        const parsed = JSON.parse(current);
        return Array.isArray(parsed) ? parsed : [];
      }
      const legacy = JSON.parse(localStorage.getItem(LEGACY_HIGH_SCORE_KEY) || '[]');
      return Array.isArray(legacy)
        ? legacy.map((item) => ({ ...item, gameMode: item.gameMode || GAME_MODES.CLASSIFICATION }))
        : [];
    } catch {
      return [];
    }
  }

  saveHighScores(scores) {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
    } catch {
      // The score screen remains usable if browser storage is unavailable.
    }
  }
}
