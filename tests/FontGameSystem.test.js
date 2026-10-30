import test from 'node:test';
import assert from 'node:assert/strict';
import { FontGameSystem, GAME_MODES, LEARNING_PAUSE_MS, SESSION_ROUNDS } from '../src/FontGameSystem.js';

function makeApp(difficulty = 'STANDARD', gameMode = GAME_MODES.CLASSIFICATION) {
  return {
    settings: { difficulty, gameMode, sound: false, haptics: false },
    views: { current: null, transition(view) { this.current = view; } },
    loaded: [],
    rendered: null,
    duelRendered: null,
    preparing: false,
    error: null,
    feedback: null,
    duelFeedback: null,
    gameOverRecord: null,
    highScores: null,
    async loadFontFamily(name) { this.loaded.push(name); return true; },
    showPreparingState() { this.preparing = true; },
    showFontPreparationError(message) { this.error = message; },
    renderRound(payload) { this.rendered = payload; },
    renderDuelRound(payload) { this.duelRendered = payload; },
    showAnswerFeedback(payload) { this.feedback = payload; },
    showDuelFeedback(payload) { this.duelFeedback = payload; },
    playFeedback() {},
    pulseHaptics() {},
    renderGameOver(record, scores) { this.gameOverRecord = record; this.highScores = scores; },
  };
}

function mockFonts() {
  const fonts = [];
  for (const category of ['Serif', 'Sans-Serif']) {
    for (let index = 1; index <= 52; index += 1) {
      const tier = index <= 22 ? 1 : index <= 42 ? 2 : 3;
      const safeName = `${category.replace('-', '')} Family ${index}`;
      fonts.push({
        id: `${category}-${index}`,
        name: safeName,
        category,
        challengeTier: tier,
        anatomicalTip: `Inspect feature ${index}.`,
        anatomicalFocus: `Feature ${index}`,
        provider: 'Google Fonts',
        familyPageUrl: `https://fonts.google.com/specimen/${encodeURIComponent(safeName)}`,
      });
    }
  }
  return fonts;
}

for (const [difficulty, allowedTiers] of [
  ['EASY', [1]],
  ['STANDARD', [1, 2, 3]],
  ['EXPERT', [3]],
]) {
  test(`${difficulty} classification selects ten unique fonts with five from each category`, async () => {
    const app = makeApp(difficulty);
    const game = new FontGameSystem(app);
    game.fonts = mockFonts();
    game.words = ['type', 'letterform', 'typography'];

    const started = await game.start();

    assert.equal(started, true);
    assert.equal(game.roundFonts.length, SESSION_ROUNDS);
    assert.equal(new Set(game.roundFonts.map((font) => font.id)).size, SESSION_ROUNDS);
    assert.equal(game.roundFonts.filter((font) => font.category === 'Serif').length, 5);
    assert.equal(game.roundFonts.filter((font) => font.category === 'Sans-Serif').length, 5);
    assert.ok(game.roundFonts.every((font) => allowedTiers.includes(font.challengeTier)));
    assert.equal(app.rendered.difficulty, difficulty);
    assert.equal(app.views.current, 'GAME_LOOP');
    assert.equal(app.error, null);
  });
}

test('Expert classification uses the mixed glyph specimen and higher score', async () => {
  const app = makeApp('EXPERT');
  const game = new FontGameSystem(app);
  game.fonts = mockFonts();
  game.words = ['type', 'letterform', 'typography'];
  await game.start();

  assert.equal(app.rendered.word, 'Hamburgefontsiv\nAaGgRr 0123456789');
  assert.equal(app.rendered.specimenFontSize, 104);
  assert.equal(game.rules.points, 150);
});

test('classification fails clearly when fewer than five verified fonts are available per category', async () => {
  const app = makeApp('EASY');
  app.loadFontFamily = async (name) => name.endsWith('1');
  const game = new FontGameSystem(app);
  game.fonts = mockFonts();
  game.words = ['type', 'letterform'];

  const started = await game.start();

  assert.equal(started, false);
  assert.ok(app.error.includes('verified'));
});

for (const [difficulty, allowedTiers] of [
  ['EASY', [1]],
  ['STANDARD', [1, 2, 3]],
  ['EXPERT', [3]],
]) {
  test(`${difficulty} Duel prepares ten unique same-category, same-tier pairs`, async () => {
    const app = makeApp(difficulty, GAME_MODES.DUEL);
    const game = new FontGameSystem(app);
    game.fonts = mockFonts();
    game.words = ['type', 'letterform', 'typography'];

    const started = await game.start();

    assert.equal(started, true);
    assert.equal(game.roundPairs.length, SESSION_ROUNDS);
    const allFonts = game.roundPairs.flatMap((pair) => [pair.left, pair.right]);
    assert.equal(new Set(allFonts.map((font) => font.id)).size, SESSION_ROUNDS * 2);
    for (const pair of game.roundPairs) {
      assert.equal(pair.left.category, pair.right.category);
      assert.equal(pair.left.challengeTier, pair.right.challengeTier);
      assert.ok(allowedTiers.includes(pair.left.challengeTier));
      assert.ok([pair.left.id, pair.right.id].includes(pair.target.id));
    }
    assert.equal(app.duelRendered.difficulty, difficulty);
    if (difficulty === 'EASY') assert.ok(app.duelRendered.word.length >= 3 && app.duelRendered.word.length <= 6);
    if (difficulty === 'STANDARD') assert.ok(app.duelRendered.word.length >= 7 && app.duelRendered.word.length <= 12);
    assert.equal(app.views.current, 'GAME_LOOP');
  });
}

test('Expert Duel uses the mixed glyph specimen', async () => {
  const app = makeApp('EXPERT', GAME_MODES.DUEL);
  const game = new FontGameSystem(app);
  game.fonts = mockFonts();
  game.words = ['letterform'];
  await game.start();

  assert.equal(app.duelRendered.word, 'Hamburgefontsiv\nAaGgRr 0123456789');
  assert.equal(app.duelRendered.specimenFontSize, 48);
});

test('Duel answer locks after one choice, scores correctly and advances after 2.5 seconds', async (t) => {
  let scheduledCallback;
  let scheduledDelay;
  const previousWindow = globalThis.window;
  globalThis.window = {
    setTimeout(callback, delay) {
      scheduledCallback = callback;
      scheduledDelay = delay;
      return 123;
    },
    clearTimeout() {},
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });

  const app = makeApp('EASY', GAME_MODES.DUEL);
  const game = new FontGameSystem(app);
  game.fonts = mockFonts();
  game.words = ['type'];
  await game.start();

  const firstPair = game.roundPairs[0];
  const correctSide = firstPair.target.id === firstPair.left.id ? 'LEFT' : 'RIGHT';
  game.answerDuel(correctSide);
  game.answerDuel(correctSide === 'LEFT' ? 'RIGHT' : 'LEFT');

  assert.equal(game.correct, 1);
  assert.equal(game.score, 75);
  assert.equal(game.answerLocked, true);
  assert.equal(app.duelFeedback.isCorrect, true);
  assert.equal(scheduledDelay, LEARNING_PAUSE_MS);

  scheduledCallback();
  assert.equal(game.roundIndex, 1);
  assert.equal(game.answerLocked, false);
  assert.equal(app.duelRendered.number, 2);
});


test('a complete ten-round Duel finishes, calculates accuracy and saves a mode-specific result', async (t) => {
  let scheduledCallback;
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  const storage = new Map();
  globalThis.window = {
    setTimeout(callback, delay) {
      assert.equal(delay, LEARNING_PAUSE_MS);
      scheduledCallback = callback;
      return 456;
    },
    clearTimeout() {},
  };
  globalThis.localStorage = {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, value); },
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  });

  const app = makeApp('STANDARD', GAME_MODES.DUEL);
  const game = new FontGameSystem(app);
  game.fonts = mockFonts();
  game.words = ['letterform', 'typography'];
  await game.start();

  for (let round = 0; round < SESSION_ROUNDS; round += 1) {
    const pair = game.roundPairs[game.roundIndex];
    const correctSide = pair.target.id === pair.left.id ? 'LEFT' : 'RIGHT';
    game.answerDuel(correctSide);
    scheduledCallback();
  }

  assert.equal(app.views.current, 'GAME_OVER');
  assert.equal(app.gameOverRecord.gameMode, GAME_MODES.DUEL);
  assert.equal(app.gameOverRecord.correct, SESSION_ROUNDS);
  assert.equal(app.gameOverRecord.accuracy, 100);
  assert.equal(app.gameOverRecord.score, SESSION_ROUNDS * 100);
  assert.equal(app.highScores.length, 1);
  const persisted = JSON.parse(storage.get('font-wars-high-scores-v2'));
  assert.equal(persisted[0].gameMode, GAME_MODES.DUEL);
  assert.equal(persisted[0].difficulty, 'STANDARD');
});

test('exiting during font verification cancels the pending session without reopening gameplay', async () => {
  const app = makeApp('STANDARD', GAME_MODES.CLASSIFICATION);
  const game = new FontGameSystem(app);
  game.fonts = mockFonts();
  game.words = ['type', 'letterform'];
  const firstBatchResolvers = [];
  let firstBatch = true;
  app.loadFontFamily = () => {
    if (firstBatch && firstBatchResolvers.length < 6) {
      return new Promise((resolve) => firstBatchResolvers.push(resolve));
    }
    return Promise.resolve(true);
  };

  const pendingStart = game.start();
  while (firstBatchResolvers.length < 6) await new Promise((resolve) => setImmediate(resolve));
  firstBatch = false;
  game.cancel();
  firstBatchResolvers.forEach((resolve) => resolve(true));

  const started = await pendingStart;
  assert.equal(started, false);
  assert.equal(app.views.current, 'LANDING');
  assert.equal(app.rendered, null);
  assert.equal(game.answerLocked, true);
});
