import * as THREE from 'three';
import { World, RayInteractable } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { SpatialViewStateManager, ViewState } from './SpatialViewStateManager.js';
import { SpatialButton, SpatialInteractionSystem } from './SpatialInteractionSystem.js';
import { FontGameSystem } from './FontGameSystem.js';

const PALETTE = {
  background: '#080b15', panel: '#111827', panelRaised: '#172236',
  blue: '#3b82f6', cyan: '#60a5fa', green: '#10b981', red: '#ef4444',
  white: '#f5f7fb', muted: '#aab7cd', dim: '#64748b',
};
const FONT_STACK = 'Inter, Arial, sans-serif';

function wrapLines(context, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text ?? '').split('\n')) {
    const words = paragraph.split(/\s+/u).filter(Boolean);
    if (!words.length) { lines.push(''); continue; }
    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${line} ${words[i]}`;
      if (context.measureText(candidate).width <= maxWidth) line = candidate;
      else { lines.push(line); line = words[i]; }
    }
    lines.push(line);
  }
  return lines;
}

// Offscreen canvases provide textures for text meshes only; none are DOM UI.
function createTextMesh(initialText, options = {}) {
  const width = options.width ?? 1;
  const height = options.height ?? 0.2;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = Math.max(256, Math.round(canvas.width * height / width));
  const context = canvas.getContext('2d', { alpha: true });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.renderOrder = 3;
  const defaults = {
    fontSize: 72, fontFamily: FONT_STACK, color: PALETTE.white,
    weight: 600, align: 'center', verticalAlign: 'middle', padding: 42,
    lineHeight: 1.22, ...options,
  };
  let currentText = initialText;
  function redraw(nextText = currentText, nextOptions = {}) {
    currentText = String(nextText ?? '');
    const current = { ...defaults, ...nextOptions };
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = `${current.weight} ${current.fontSize}px ${current.fontFamily}`;
    context.fillStyle = current.color;
    context.textAlign = current.align;
    context.textBaseline = 'middle';
    const lines = wrapLines(context, currentText, canvas.width - current.padding * 2);
    const lineHeight = current.fontSize * current.lineHeight;
    const totalHeight = lines.length * lineHeight;
    let y = current.verticalAlign === 'top'
      ? current.padding + lineHeight / 2
      : (canvas.height - totalHeight) / 2 + lineHeight / 2;
    const x = current.align === 'left' ? current.padding
      : current.align === 'right' ? canvas.width - current.padding : canvas.width / 2;
    for (const line of lines) {
      context.fillText(line, x, y, canvas.width - current.padding * 2);
      y += lineHeight;
    }
    texture.needsUpdate = true;
  }
  mesh.userData.redraw = redraw;
  redraw(initialText, options);
  return mesh;
}

function updateText(mesh, text, options = {}) {
  mesh?.userData?.redraw?.(text, options);
}

function createPanel(width, height, color = PALETTE.panel) {
  const group = new THREE.Group();
  const border = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.025, height + 0.025, 0.07),
    new THREE.MeshStandardMaterial({ color: '#223960', metalness: 0.12, roughness: 0.68 }),
  );
  group.add(border);
  const surface = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.075),
    new THREE.MeshStandardMaterial({ color, metalness: 0.08, roughness: 0.78 }),
  );
  surface.position.z = 0.035;
  group.add(surface);
  const side = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, height - 0.11, 0.012),
    new THREE.MeshBasicMaterial({ color: PALETTE.blue }),
  );
  side.position.set(-width / 2 + 0.035, 0, 0.08);
  group.add(side);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(0.72, width * 0.38), 0.012, 0.012),
    new THREE.MeshBasicMaterial({ color: PALETTE.cyan }),
  );
  top.position.set(-width / 2 + Math.min(0.42, width * 0.26), height / 2 - 0.035, 0.08);
  group.add(top);
  return group;
}

class FontWarsApp {
  constructor(world) {
    this.world = world;
    this.views = new SpatialViewStateManager(world.scene);
    this.settings = { sound: true, haptics: true, difficulty: 'STANDARD' };
    this.game = new FontGameSystem(this);
    this.fontLoadPromises = new Map();
    this.libraryPage = 0;
    this.libraryPageSize = 8;
    this.activeSpecimenFontId = null;
    this.audioContext = null;
    this.libraryCards = [];
  }

  async initialize() {
    this.configureWorld();
    await this.game.initialize();
    this.buildLandingView();
    this.buildLibraryView();
    this.buildSettingsView();
    this.buildGameView();
    this.buildGameOverView();
    this.views.transition(ViewState.LANDING);
  }

  configureWorld() {
    const scene = this.world.scene;
    scene.background = new THREE.Color(PALETTE.background);
    scene.fog = new THREE.Fog(PALETTE.background, 7.5, 19);
    scene.add(new THREE.HemisphereLight(0xc5ddff, 0x101525, 1.15));
    const keyLight = new THREE.DirectionalLight(0xdceaff, 1.45);
    keyLight.position.set(-2.8, 4.3, 3.4);
    scene.add(keyLight);
    const blueLight = new THREE.PointLight(0x3479ff, 3.2, 10);
    blueLight.position.set(2.4, 1.9, -2.2);
    scene.add(blueLight);
    const starPositions = [];
    for (let i = 0; i < 180; i += 1) {
      starPositions.push((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 8 + 1.5, -5.8 - Math.random() * 12);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0x7caeff, size: 0.025, transparent: true, opacity: 0.5, sizeAttenuation: true,
    })));
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.003, 6, 180),
      new THREE.MeshBasicMaterial({ color: 0x244a8a, transparent: true, opacity: 0.6 }),
    );
    orbit.position.set(0, 1.55, -3.8);
    orbit.rotation.x = Math.PI / 2.7;
    scene.add(orbit);
  }

  createView(name, width, height, z = -2.35) {
    const root = new THREE.Group();
    root.position.set(0, 1.63, z);
    const view = this.views.register(name, root);
    view.add(createPanel(width, height));
    return view;
  }

  addLabel(view, text, options) {
    const mesh = createTextMesh(text, options);
    mesh.position.set(options.x ?? 0, options.y ?? 0, options.z ?? 0.092);
    view.add(mesh);
    return mesh;
  }

  addHeading(view, title, subtitle = '') {
    this.addLabel(view, title, {
      width: 2.55, height: 0.29, fontSize: 96, fontFamily: FONT_STACK,
      color: PALETTE.white, weight: 800, x: 0.02, y: 0.66,
    });
    if (subtitle) {
      this.addLabel(view, subtitle, {
        width: 2.4, height: 0.15, fontSize: 40, color: PALETTE.muted,
        weight: 500, x: 0.02, y: 0.45,
      });
    }
  }

  makeSpatialButton(view, {
    label, x = 0, y = 0, z = 0.095, width = 1.45, height = 0.29,
    fontSize = 60, color = PALETTE.panelRaised, fontColor = PALETTE.white,
    fontWeight = 650, activate = () => {}, labelFamily = FONT_STACK,
  }) {
    const button = new THREE.Group();
    button.position.set(x, y, z);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.035),
      new THREE.MeshStandardMaterial({ color, metalness: 0.04, roughness: 0.62, emissive: '#000000' }),
    );
    button.add(body);
    const labelMesh = createTextMesh(label, {
      width: width * 0.9, height: height * 0.72, fontSize,
      color: fontColor, weight: fontWeight, fontFamily: labelFamily, padding: 28,
    });
    labelMesh.position.z = 0.023;
    button.add(labelMesh);
    button.userData.labelMesh = labelMesh;
    button.userData.redrawLabel = (nextLabel, opts = {}) => updateText(labelMesh, nextLabel, opts);
    button.userData.spatialButton = {
      bodyMaterials: [body.material], visualState: 'default', lockedColor: null,
      disabled: false, activate,
    };
    this.world.createTransformEntity(button).addComponent(RayInteractable).addComponent(SpatialButton, { id: button.uuid });
    view.add(button);
    return button;
  }

  buildLandingView() {
    const view = this.createView(ViewState.LANDING, 2.9, 1.9, -2.25);
    this.addHeading(view, 'FONT WARS', 'TYPOGRAPHIC RECOGNITION TRAINING');
    this.addLabel(view, '400 TYPEFACES  ·  10 ROUNDS  ·  ONE SHARP EYE', {
      width: 2.6, height: 0.13, fontSize: 35, color: '#8eb6ff', weight: 600,
      x: 0.02, y: 0.26,
    });
    this.makeSpatialButton(view, {
      label: 'START BATTLE', y: -0.12, width: 1.72, height: 0.31, fontSize: 59,
      color: '#234f91', activate: () => this.game.start(),
    });
    this.makeSpatialButton(view, {
      label: 'FONT LIBRARY', y: -0.51, width: 1.72, height: 0.29, fontSize: 53,
      activate: () => { this.libraryPage = 0; this.updateLibraryPage(); this.views.transition(ViewState.LIBRARY); },
    });
    this.makeSpatialButton(view, {
      label: 'SETTINGS', y: -0.87, width: 1.72, height: 0.29, fontSize: 53,
      activate: () => this.views.transition(ViewState.SETTINGS),
    });
  }

  buildLibraryView() {
    const view = this.createView(ViewState.LIBRARY, 3.2, 2.12, -2.45);
    this.addLabel(view, 'TYPEFACE LIBRARY', {
      width: 2.7, height: 0.21, fontSize: 76, color: PALETTE.white, weight: 760, x: 0, y: 0.84,
    });
    this.libraryPageLabel = this.addLabel(view, '', {
      width: 1.7, height: 0.13, fontSize: 39, color: PALETTE.muted, weight: 500, x: 0, y: 0.66,
    });
    const xs = [-1.14, -0.38, 0.38, 1.14];
    const ys = [0.29, -0.32];
    for (let i = 0; i < this.libraryPageSize; i += 1) {
      const card = this.makeSpatialButton(view, {
        label: 'Loading typeface', x: xs[i % 4], y: ys[Math.floor(i / 4)],
        width: 0.69, height: 0.53, fontSize: 40, fontWeight: 600, color: '#162033',
        activate: () => this.previewLibraryFont(i),
      });
      card.userData.redrawLabel('');
      this.libraryCards.push(card);
    }
    this.librarySelectedInfo = this.addLabel(view, 'Select a typeface card to inspect its anatomical cues.', {
      width: 2.9, height: 0.16, fontSize: 31, color: '#8eb6ff', weight: 500, x: 0, y: -0.68,
    });
    this.libraryPrevious = this.makeSpatialButton(view, {
      label: 'PREVIOUS', x: -0.96, y: -0.91, width: 0.78, height: 0.22, fontSize: 39,
      activate: () => { this.libraryPage = Math.max(0, this.libraryPage - 1); this.updateLibraryPage(); },
    });
    this.libraryNext = this.makeSpatialButton(view, {
      label: 'NEXT', x: 0, y: -0.91, width: 0.7, height: 0.22, fontSize: 39,
      activate: () => {
        const maxPage = Math.ceil(this.game.fonts.length / this.libraryPageSize) - 1;
        this.libraryPage = Math.min(maxPage, this.libraryPage + 1);
        this.updateLibraryPage();
      },
    });
    this.makeSpatialButton(view, {
      label: 'BACK', x: 0.96, y: -0.91, width: 0.78, height: 0.22, fontSize: 39,
      activate: () => this.views.transition(ViewState.LANDING),
    });
    this.updateLibraryPage();
  }

  updateButtonDisabled(button, disabled) {
    if (!button?.userData?.spatialButton) return;
    button.userData.spatialButton.disabled = Boolean(disabled);
    button.userData.spatialButton.lockedColor = null;
    button.userData.spatialButton.visualState = null;
  }

  updateLibraryPage() {
    if (!this.game.fonts.length || !this.libraryCards.length) return;
    const totalPages = Math.ceil(this.game.fonts.length / this.libraryPageSize);
    const start = this.libraryPage * this.libraryPageSize;
    updateText(this.libraryPageLabel, `PAGE ${this.libraryPage + 1} / ${totalPages}  ·  400 TYPEFACES`, { fontSize: 36 });
    this.libraryPageFonts = this.game.fonts.slice(start, start + this.libraryPageSize);
    this.libraryCards.forEach((button, index) => {
      const font = this.libraryPageFonts[index];
      const state = button.userData.spatialButton;
      if (!font) {
        button.visible = false;
        state.disabled = true;
        return;
      }
      button.visible = true;
      state.disabled = false;
      state.lockedColor = null;
      const fallback = font.category === 'Serif' ? 'Georgia, "Times New Roman", serif' : 'Arial, Helvetica, sans-serif';
      const drawCard = () => button.userData.redrawLabel(`${font.name}\n${font.category}\n${font.anatomicalTip}`, {
        fontSize: 35, color: '#e9effb', fontFamily: `"${font.name}", ${fallback}`,
        weight: 550, padding: 22, lineHeight: 1.25,
      });
      drawCard();
      this.loadFontFamily(font.name).then(() => {
        if (this.views.current === ViewState.LIBRARY && this.libraryPageFonts[index]?.id === font.id) drawCard();
      });
    });
    this.updateButtonDisabled(this.libraryPrevious, this.libraryPage === 0);
    this.updateButtonDisabled(this.libraryNext, this.libraryPage >= totalPages - 1);
    updateText(this.librarySelectedInfo, 'Select a typeface card to inspect its anatomical cues.', { fontSize: 31, color: '#8eb6ff' });
  }

  previewLibraryFont(index) {
    const font = this.libraryPageFonts?.[index];
    if (!font) return;
    updateText(this.librarySelectedInfo, `${font.name}  ·  ${font.category}\n${font.anatomicalTip}`, {
      fontSize: 35, color: '#bcd3ff', weight: 550, lineHeight: 1.25,
    });
    this.loadFontFamily(font.name);
  }

  buildSettingsView() {
    const view = this.createView(ViewState.SETTINGS, 2.75, 2.0, -2.3);
    this.addLabel(view, 'SETTINGS', {
      width: 2.2, height: 0.28, fontSize: 91, color: PALETTE.white, weight: 780, x: 0, y: 0.69,
    });
    this.soundButton = this.makeSpatialButton(view, {
      label: '', y: 0.25, width: 1.75, height: 0.27, fontSize: 50,
      activate: () => {
        this.settings.sound = !this.settings.sound;
        this.refreshSettingsLabels();
        if (this.settings.sound) this.playTone(650, 0.06, 0.04);
      },
    });
    this.hapticsButton = this.makeSpatialButton(view, {
      label: '', y: -0.10, width: 1.75, height: 0.27, fontSize: 50,
      activate: () => { this.settings.haptics = !this.settings.haptics; this.refreshSettingsLabels(); },
    });
    this.difficultyButton = this.makeSpatialButton(view, {
      label: '', y: -0.45, width: 1.75, height: 0.27, fontSize: 49,
      activate: () => {
        const modes = ['EASY', 'STANDARD', 'EXPERT'];
        this.settings.difficulty = modes[(modes.indexOf(this.settings.difficulty) + 1) % modes.length];
        this.refreshSettingsLabels();
      },
    });
    this.makeSpatialButton(view, {
      label: 'BACK', y: -0.83, width: 1.12, height: 0.26, fontSize: 48,
      activate: () => this.views.transition(ViewState.LANDING),
    });
    this.refreshSettingsLabels();
  }

  refreshSettingsLabels() {
    this.soundButton?.userData.redrawLabel(`SOUND: ${this.settings.sound ? 'ON' : 'OFF'}`, { fontSize: 50 });
    this.hapticsButton?.userData.redrawLabel(`HAPTICS: ${this.settings.haptics ? 'ON' : 'OFF'}`, { fontSize: 50 });
    this.difficultyButton?.userData.redrawLabel(`DIFFICULTY: ${this.settings.difficulty}`, { fontSize: 42 });
  }

  buildGameView() {
    const view = this.createView(ViewState.GAME_LOOP, 2.9, 2.08, -2.35);
    this.gameHeading = this.addLabel(view, 'TYPEFACE CLASSIFICATION', {
      width: 2.6, height: 0.21, fontSize: 67, color: PALETTE.white, weight: 760, x: 0, y: 0.82,
    });
    this.roundLabel = this.addLabel(view, 'ROUND 1 / 10', {
      width: 1.0, height: 0.13, fontSize: 43, color: PALETTE.muted, weight: 550, x: -0.82, y: 0.62,
    });
    this.scoreLabel = this.addLabel(view, 'SCORE 0', {
      width: 0.96, height: 0.13, fontSize: 43, color: '#8eb6ff', weight: 550, x: 0.87, y: 0.62,
    });
    this.questionLabel = this.addLabel(view, 'SERIF OR SANS-SERIF?', {
      width: 2.1, height: 0.18, fontSize: 53, color: PALETTE.muted, weight: 520, x: 0, y: 0.39,
    });
    this.specimen = this.addLabel(view, 'TYPOGRAPHY', {
      width: 2.38, height: 0.48, fontSize: 210, color: PALETTE.white, weight: 600,
      x: 0, y: 0.03, fontFamily: 'Georgia, serif', padding: 16,
    });
    this.anatomyTip = this.addLabel(view, '', {
      width: 2.6, height: 0.31, fontSize: 37, color: '#c6f5e4', weight: 520,
      x: 0, y: 0.43, verticalAlign: 'middle', lineHeight: 1.15,
    });
    this.anatomyTip.visible = false;
    this.feedbackLabel = this.addLabel(view, '', {
      width: 2.55, height: 0.17, fontSize: 48, color: PALETTE.white, weight: 750, x: 0, y: -0.36,
    });
    this.feedbackLabel.visible = false;
    this.serifAnswer = this.makeSpatialButton(view, {
      label: 'SERIF', x: -0.73, y: -0.73, width: 1.12, height: 0.31, fontSize: 61,
      activate: () => this.game.answer('Serif'),
    });
    this.sansAnswer = this.makeSpatialButton(view, {
      label: 'SANS-SERIF', x: 0.73, y: -0.73, width: 1.35, height: 0.31, fontSize: 49,
      activate: () => this.game.answer('Sans-Serif'),
    });
  }

  renderRound({ font, word, number, total, score }) {
    this.activeSpecimenFontId = font.id;
    this.currentRoundFont = font;
    this.currentRoundWord = word;
    updateText(this.roundLabel, `ROUND ${number} / ${total}`, { fontSize: 43, color: PALETTE.muted });
    updateText(this.scoreLabel, `SCORE ${score}`, { fontSize: 43, color: '#8eb6ff' });
    updateText(this.questionLabel, 'SERIF OR SANS-SERIF?', { fontSize: 53, color: PALETTE.muted });
    const fallback = font.category === 'Serif' ? 'Georgia, "Times New Roman", serif' : 'Arial, Helvetica, sans-serif';
    updateText(this.specimen, word, {
      fontSize: 210, fontFamily: `"${font.name}", ${fallback}`, color: PALETTE.white, weight: 550,
    });
    this.specimen.visible = true;
    this.questionLabel.visible = true;
    this.anatomyTip.visible = false;
    this.feedbackLabel.visible = false;
    this.setAnswerButtonState(this.serifAnswer, { disabled: false, color: null });
    this.setAnswerButtonState(this.sansAnswer, { disabled: false, color: null });
  }

  redrawSpecimen(font) {
    const fallback = font.category === 'Serif' ? 'Georgia, "Times New Roman", serif' : 'Arial, Helvetica, sans-serif';
    updateText(this.specimen, this.currentRoundWord, {
      fontSize: 210, fontFamily: `"${font.name}", ${fallback}`, color: PALETTE.white, weight: 550,
    });
  }

  setAnswerButtonState(button, { disabled, color }) {
    const state = button.userData.spatialButton;
    state.disabled = Boolean(disabled);
    state.lockedColor = color;
    state.visualState = null;
  }

  showAnswerFeedback({ chosen, correctCategory, isCorrect, tip, score }) {
    this.specimen.visible = true;
    this.questionLabel.visible = false;
    this.anatomyTip.visible = true;
    this.feedbackLabel.visible = true;
    updateText(this.anatomyTip, `ANATOMY  ·  ${tip}`, {
      fontSize: 37, color: '#baf2dd', weight: 520, lineHeight: 1.13,
    });
    const feedback = isCorrect ? 'CORRECT  ·  WELL SPOTTED' : `NOT QUITE  ·  ${correctCategory.toUpperCase()}`;
    updateText(this.feedbackLabel, feedback, {
      fontSize: 45, color: isCorrect ? PALETTE.green : PALETTE.red, weight: 780,
    });
    updateText(this.scoreLabel, `SCORE ${score}`, { fontSize: 43, color: '#8eb6ff' });
    this.setAnswerButtonState(this.serifAnswer, {
      disabled: true,
      color: correctCategory === 'Serif' ? 'selected' : (chosen === 'Serif' ? 'incorrect' : 'disabled'),
    });
    this.setAnswerButtonState(this.sansAnswer, {
      disabled: true,
      color: correctCategory === 'Sans-Serif' ? 'selected' : (chosen === 'Sans-Serif' ? 'incorrect' : 'disabled'),
    });
  }

  buildGameOverView() {
    const view = this.createView(ViewState.GAME_OVER, 2.9, 2.05, -2.35);
    this.addLabel(view, 'BATTLE COMPLETE', {
      width: 2.55, height: 0.27, fontSize: 83, color: PALETTE.white, weight: 780, x: 0, y: 0.72,
    });
    this.gameOverSummary = this.addLabel(view, '', {
      width: 2.45, height: 0.32, fontSize: 68, color: '#bcd3ff', weight: 650, x: 0, y: 0.36,
    });
    this.highScoresLabel = this.addLabel(view, '', {
      width: 2.55, height: 0.48, fontSize: 39, color: PALETTE.muted, weight: 520,
      x: 0, y: -0.12, lineHeight: 1.22,
    });
    this.makeSpatialButton(view, {
      label: 'PLAY AGAIN', x: -0.69, y: -0.72, width: 1.15, height: 0.28, fontSize: 47,
      color: '#234f91', activate: () => this.game.start(),
    });
    this.makeSpatialButton(view, {
      label: 'MAIN MENU', x: 0.7, y: -0.72, width: 1.18, height: 0.28, fontSize: 45,
      activate: () => this.views.transition(ViewState.LANDING),
    });
  }

  renderGameOver(record, highScores) {
    updateText(this.gameOverSummary, `${record.score} POINTS\n${record.correct}/${record.total} CORRECT  ·  ${record.accuracy}%`, {
      fontSize: 60, color: '#bcd3ff', weight: 650, lineHeight: 1.16,
    });
    const lines = highScores.slice(0, 3).map((item, index) => `${index + 1}.  ${item.score} PTS   ·   ${item.accuracy}%`);
    updateText(this.highScoresLabel, `HIGH SCORES\n${lines.join('\n') || 'Complete a battle to set a record.'}`, {
      fontSize: 38, color: PALETTE.muted, weight: 520, lineHeight: 1.2,
    });
  }

  async loadFontFamily(name) {
    if (!name) return false;
    if (this.fontLoadPromises.has(name)) return this.fontLoadPromises.get(name);
    const promise = new Promise((resolve) => {
      const safeFamily = String(name).replace(/[\u0000-\u001f"<>]/gu, '').trim();
      const query = new URLSearchParams({ family: `${safeFamily}:wght@400;500;700`, display: 'swap' });
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${query.toString()}`;
      link.crossOrigin = 'anonymous';
      link.onload = async () => {
        try {
          await document.fonts.load(`500 128px "${safeFamily}"`);
          resolve(true);
        } catch {
          resolve(false);
        }
      };
      link.onerror = () => resolve(false);
      document.head.appendChild(link);
      window.setTimeout(() => resolve(false), 1800);
    });
    this.fontLoadPromises.set(name, promise);
    return promise;
  }

  playFeedback(correct) {
    if (!this.settings.sound) return;
    if (correct) {
      this.playTone(740, 0.09, 0.055);
      window.setTimeout(() => this.playTone(980, 0.1, 0.045), 70);
    } else {
      this.playTone(240, 0.16, 0.05);
    }
  }

  playTone(frequency, duration = 0.08, volume = 0.04) {
    if (!this.settings.sound) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioContext) this.audioContext = new AudioContextClass();
      if (this.audioContext.state === 'suspended') this.audioContext.resume();
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch {
      // Audio is optional; the game remains usable without it.
    }
  }

  pulseHaptics(correct) {
    if (!this.settings.haptics) return;
    try {
      if (typeof navigator.vibrate === 'function') navigator.vibrate(correct ? [18, 24, 18] : [48]);
      const sources = this.world.input?.xr?.gamepads;
      if (sources && typeof sources[Symbol.iterator] === 'function') {
        for (const source of sources) {
          const actuator = source?.gamepad?.hapticActuators?.[0] || source?.hapticActuators?.[0];
          actuator?.pulse?.(correct ? 0.35 : 0.65, correct ? 55 : 95);
        }
      }
    } catch {
      // Some headsets and browsers do not expose haptic actuators to web content.
    }
  }
}

async function boot() {
  const container = document.getElementById('scene-container');
  if (!container) throw new Error('Missing #scene-container render target.');
  const world = await World.create(container, projectOptions);
  world.registerSystem(SpatialInteractionSystem);
  const app = new FontWarsApp(world);
  window.__fontWarsApp = app;
  await app.initialize();
}

boot().catch((error) => {
  console.error('[Font Wars] Could not start the application.', error);
});
