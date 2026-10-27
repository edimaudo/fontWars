export const SESSION_ROUNDS = 10;
export const LEARNING_PAUSE_MS = 2500;
const HIGH_SCORE_KEY = 'font-wars-high-scores-v1';

export class FontGameSystem {
  constructor(app) {
    this.app = app;
    this.fonts = [];
    this.words = [];
    this.roundFonts = [];
    this.roundIndex = 0;
    this.score = 0;
    this.correct = 0;
    this.answerLocked = false;
    this.sessionStartedAt = 0;
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
    if (this.fonts.length !== 400 || serifCount !== 200 || sansCount !== 200 || this.words.length < 20) {
      throw new Error('Font Wars data validation failed. Expected 400 fonts (200 per category) and at least 20 words.');
    }
  }

  start() {
    const shuffled = [...this.fonts].sort(() => Math.random() - 0.5);
    this.roundFonts = shuffled.slice(0, SESSION_ROUNDS);
    this.roundIndex = 0;
    this.score = 0;
    this.correct = 0;
    this.answerLocked = false;
    this.sessionStartedAt = Date.now();
    this.app.views.transition('GAME_LOOP');
    this.showRound();
  }

  showRound() {
    this.answerLocked = false;
    const font = this.roundFonts[this.roundIndex];
    const word = this.words[Math.floor(Math.random() * this.words.length)];
    this.app.renderRound({
      font,
      word,
      number: this.roundIndex + 1,
      total: SESSION_ROUNDS,
      score: this.score,
    });
    this.app.loadFontFamily(font.name).then(() => {
      // Only redraw when this round is still active; font-loading can resolve late.
      if (this.app.activeSpecimenFontId === font.id) this.app.redrawSpecimen(font);
    });
  }

  answer(category) {
    if (this.answerLocked) return;
    const font = this.roundFonts[this.roundIndex];
    if (!font) return;
    this.answerLocked = true;
    const correct = category === font.category;
    if (correct) {
      this.correct += 1;
      const multiplier = this.app.settings.difficulty === 'EXPERT' ? 1.5 : 1;
      const basePoints = this.app.settings.difficulty === 'EASY' ? 75 : 100;
      this.score += Math.round(basePoints * multiplier);
    }

    this.app.playFeedback(correct);
    this.app.pulseHaptics(correct);
    this.app.showAnswerFeedback({
      chosen: category,
      correctCategory: font.category,
      isCorrect: correct,
      tip: font.anatomicalTip,
      score: this.score,
    });

    window.setTimeout(() => {
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
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - this.sessionStartedAt,
    };
    const scores = this.readHighScores();
    scores.push(record);
    scores.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
    this.saveHighScores(scores.slice(0, 5));
    this.app.renderGameOver(record, scores.slice(0, 5));
    this.app.views.transition('GAME_OVER');
  }

  readHighScores() {
    try {
      const value = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
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
