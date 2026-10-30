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
    mesh.userData.currentText = currentText;
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
    this.settings = { sound: true, haptics: true, difficulty: 'STANDARD', gameMode: 'CLASSIFICATION' };
    this.game = new FontGameSystem(this);
    this.fontLoadPromises = new Map();
    this.libraryPage = 0;
    this.libraryPageSize = 6;
    this.libraryFilter = 'ALL';
    this.libraryGlyphMode = 'AaGg';
    this.librarySelectedFontId = null;
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
    const view = this.createView(ViewState.LANDING, 2.9, 2.8, -2.25);
    this.addHeading(view, 'FONT WARS', 'TYPOGRAPHIC RECOGNITION TRAINING');
    this.addLabel(view, '400 TYPEFACES  ·  10 ROUNDS  ·  ONE SHARP EYE', {
      width: 2.6, height: 0.13, fontSize: 35, color: '#8eb6ff', weight: 600,
      x: 0.02, y: 0.26,
    });
    this.makeSpatialButton(view, {
      label: 'START BATTLE', y: -0.08, width: 1.72, height: 0.31, fontSize: 59,
      color: '#234f91', activate: () => this.game.start(),
    });
    this.gameModeButton = this.makeSpatialButton(view, {
      label: '', y: -0.45, width: 1.95, height: 0.27, fontSize: 43,
      activate: () => {
        this.settings.gameMode = this.settings.gameMode === 'CLASSIFICATION' ? 'DUEL' : 'CLASSIFICATION';
        this.refreshGameModeLabel();
      },
    });
    this.gameModeDescription = this.addLabel(view, '', {
      width: 2.4, height: 0.10, fontSize: 28, color: PALETTE.muted, weight: 500,
      x: 0.02, y: -0.68,
    });
    this.makeSpatialButton(view, {
      label: 'FONT LIBRARY', y: -0.98, width: 1.72, height: 0.26, fontSize: 50,
      activate: () => { this.libraryPage = 0; this.updateLibraryPage(); this.views.transition(ViewState.LIBRARY); },
    });
    this.makeSpatialButton(view, {
      label: 'SETTINGS', y: -1.31, width: 1.72, height: 0.26, fontSize: 50,
      activate: () => this.views.transition(ViewState.SETTINGS),
    });
    this.refreshGameModeLabel();
  }

  refreshGameModeLabel() {
    const duel = this.settings.gameMode === 'DUEL';
    this.gameModeButton?.userData.redrawLabel(`MODE: ${duel ? 'TYPEFACE DUEL' : 'CLASSIFICATION'}`, { fontSize: 39 });
    if (this.gameModeDescription) {
      updateText(this.gameModeDescription, duel
        ? 'Match the named typeface from two specimens.'
        : 'Identify each typeface as Serif or Sans-Serif.', {
        fontSize: 28, color: PALETTE.muted,
      });
    }
  }

  buildLibraryView() {
    const view = this.createView(ViewState.LIBRARY, 3.6, 2.28, -2.45);
    this.addLabel(view, 'TYPEFACE LIBRARY', {
      width: 2.7, height: 0.21, fontSize: 76, color: PALETTE.white, weight: 760, x: 0, y: 0.96,
    });
    this.libraryPageLabel = this.addLabel(view, '', {
      width: 1.25, height: 0.11, fontSize: 30, color: PALETTE.muted, weight: 500, x: -0.08, y: 0.73,
    });
    this.libraryFilterButton = this.makeSpatialButton(view, {
      label: 'SHOW: ALL', x: -1.22, y: 0.72, width: 0.72, height: 0.19, fontSize: 34,
      activate: () => {
        const filters = ['ALL', 'SERIF', 'SANS-SERIF'];
        this.libraryFilter = filters[(filters.indexOf(this.libraryFilter) + 1) % filters.length];
        this.libraryPage = 0;
        this.librarySelectedFontId = null;
        this.updateLibraryPage();
      },
    });

    const cardXs = [-1.23, -0.68, -0.13];
    const cardYs = [0.31, -0.26];
    for (let index = 0; index < this.libraryPageSize; index += 1) {
      const card = this.makeSpatialButton(view, {
        label: '', x: cardXs[index % 3], y: cardYs[Math.floor(index / 3)],
        width: 0.5, height: 0.48, fontSize: 28, fontWeight: 550, color: '#162033',
        activate: () => this.previewLibraryFont(index),
      });
      const specimen = createTextMesh('···', {
        width: 0.45, height: 0.19, fontSize: 55, fontFamily: FONT_STACK,
        color: '#f5f7fb', weight: 550, padding: 8,
      });
      specimen.position.set(0, 0.055, 0.049);
      const title = createTextMesh('Loading', {
        width: 0.46, height: 0.09, fontSize: 24, fontFamily: FONT_STACK,
        color: '#dce6f7', weight: 650, padding: 8,
      });
      title.position.set(0, -0.105, 0.049);
      const category = createTextMesh('', {
        width: 0.46, height: 0.055, fontSize: 19, fontFamily: FONT_STACK,
        color: '#8eb6ff', weight: 560, padding: 8,
      });
      category.position.set(0, -0.177, 0.049);
      card.add(specimen, title, category);
      card.userData.libraryText = { specimen, title, category };
      card.userData.redrawLabel('');
      this.libraryCards.push(card);
    }

    this.libraryDetailName = this.addLabel(view, 'SELECT A TYPEFACE', {
      width: 1.42, height: 0.15, fontSize: 48, color: PALETTE.white, weight: 700,
      x: 0.91, y: 0.53,
    });
    this.libraryDetailMeta = this.addLabel(view, '400 FONT RECORDS  ·  200 EACH CATEGORY', {
      width: 1.42, height: 0.09, fontSize: 27, color: '#8eb6ff', weight: 550,
      x: 0.91, y: 0.36,
    });
    this.libraryPreviewSpecimen = this.addLabel(view, 'AaGg Rr', {
      width: 1.43, height: 0.3, fontSize: 148, color: PALETTE.white,
      weight: 500, x: 0.91, y: 0.04, fontFamily: FONT_STACK, padding: 12,
    });
    this.libraryGlyphButtons = [
      this.makeSpatialButton(view, {
        label: 'AaGg', x: 0.43, y: -0.23, width: 0.42, height: 0.17, fontSize: 31,
        activate: () => this.setLibraryGlyphMode('AaGg'),
      }),
      this.makeSpatialButton(view, {
        label: 'R Q &', x: 0.91, y: -0.23, width: 0.42, height: 0.17, fontSize: 29,
        activate: () => this.setLibraryGlyphMode('R Q &'),
      }),
      this.makeSpatialButton(view, {
        label: '0–9', x: 1.39, y: -0.23, width: 0.34, height: 0.17, fontSize: 31,
        activate: () => this.setLibraryGlyphMode('0123456789'),
      }),
    ];
    this.libraryGlyphButtons[0].userData.glyphMode = 'AaGg';
    this.libraryGlyphButtons[1].userData.glyphMode = 'R Q &';
    this.libraryGlyphButtons[2].userData.glyphMode = '0123456789';
    this.librarySelectedInfo = this.addLabel(view, 'Choose a typeface to examine its letterforms and anatomical cues.', {
      width: 1.48, height: 0.43, fontSize: 30, color: '#bcd3ff', weight: 500,
      x: 0.91, y: -0.60, lineHeight: 1.18, verticalAlign: 'top', align: 'left', padding: 8,
    });

    this.libraryPrevious = this.makeSpatialButton(view, {
      label: 'PREVIOUS', x: -1.09, y: -0.94, width: 0.64, height: 0.19, fontSize: 32,
      activate: () => { this.libraryPage = Math.max(0, this.libraryPage - 1); this.updateLibraryPage(); },
    });
    this.libraryNext = this.makeSpatialButton(view, {
      label: 'NEXT', x: -0.38, y: -0.94, width: 0.52, height: 0.19, fontSize: 33,
      activate: () => {
        const maxPage = Math.max(0, Math.ceil(this.getFilteredLibraryFonts().length / this.libraryPageSize) - 1);
        this.libraryPage = Math.min(maxPage, this.libraryPage + 1);
        this.updateLibraryPage();
      },
    });
    this.makeSpatialButton(view, {
      label: 'BACK', x: 0.43, y: -0.94, width: 0.56, height: 0.19, fontSize: 33,
      activate: () => this.views.transition(ViewState.LANDING),
    });
    this.updateLibraryPage();
  }

  getFilteredLibraryFonts() {
    if (this.libraryFilter === 'SERIF') return this.game.fonts.filter((font) => font.category === 'Serif');
    if (this.libraryFilter === 'SANS-SERIF') return this.game.fonts.filter((font) => font.category === 'Sans-Serif');
    return this.game.fonts;
  }

  updateButtonDisabled(button, disabled) {
    if (!button?.userData?.spatialButton) return;
    button.userData.spatialButton.disabled = Boolean(disabled);
    button.userData.spatialButton.lockedColor = null;
    button.userData.spatialButton.visualState = null;
  }

  updateLibraryPage() {
    const filteredFonts = this.getFilteredLibraryFonts();
    if (!filteredFonts.length || !this.libraryCards.length) return;
    const totalPages = Math.max(1, Math.ceil(filteredFonts.length / this.libraryPageSize));
    this.libraryPage = Math.min(this.libraryPage, totalPages - 1);
    const start = this.libraryPage * this.libraryPageSize;
    this.libraryPageFonts = filteredFonts.slice(start, start + this.libraryPageSize);
    updateText(this.libraryPageLabel, `PAGE ${this.libraryPage + 1} / ${totalPages}  ·  ${filteredFonts.length} FONTS`, { fontSize: 30 });
    this.libraryFilterButton?.userData.redrawLabel(`SHOW: ${this.libraryFilter}`, { fontSize: 29 });

    this.libraryCards.forEach((button, index) => {
      const font = this.libraryPageFonts[index];
      const state = button.userData.spatialButton;
      const textMeshes = button.userData.libraryText;
      if (!font) {
        button.visible = false;
        state.disabled = true;
        return;
      }
      button.visible = true;
      state.disabled = false;
      state.lockedColor = font.id === this.librarySelectedFontId ? 'selected' : null;
      state.visualState = null;
      updateText(textMeshes.specimen, 'LOADING', { fontSize: 23, color: PALETTE.muted, fontFamily: FONT_STACK });
      updateText(textMeshes.title, font.name, { fontSize: 23, color: '#dce6f7', fontFamily: FONT_STACK });
      updateText(textMeshes.category, font.category.toUpperCase(), { fontSize: 18, color: '#8eb6ff', fontFamily: FONT_STACK });
      this.loadFontFamily(font.name).then((available) => {
        if (this.views.current !== ViewState.LIBRARY || this.libraryPageFonts[index]?.id !== font.id) return;
        if (available) {
          updateText(textMeshes.specimen, 'AaGg', {
            fontSize: 53, color: '#f5f7fb', fontFamily: `"${font.name}"`, weight: 520,
          });
        } else {
          updateText(textMeshes.specimen, 'UNAVAILABLE', {
            fontSize: 21, color: PALETTE.red, fontFamily: FONT_STACK, weight: 650,
          });
        }
      });
    });

    this.updateButtonDisabled(this.libraryPrevious, this.libraryPage === 0);
    this.updateButtonDisabled(this.libraryNext, this.libraryPage >= totalPages - 1);
    const selected = this.libraryPageFonts.find((font) => font.id === this.librarySelectedFontId) || this.libraryPageFonts[0];
    this.previewLibraryFont(this.libraryPageFonts.indexOf(selected));
  }

  previewLibraryFont(index) {
    const font = this.libraryPageFonts?.[index];
    if (!font) return;
    this.librarySelectedFontId = font.id;
    this.libraryCards.forEach((card, cardIndex) => {
      const current = this.libraryPageFonts[cardIndex];
      if (current) {
        card.userData.spatialButton.lockedColor = current.id === font.id ? 'selected' : null;
        card.userData.spatialButton.visualState = null;
      }
    });
    updateText(this.libraryDetailName, font.name, {
      fontSize: font.name.length > 18 ? 39 : 47, color: PALETTE.white, weight: 720,
    });
    const challengeLabel = { 1: 'EASY', 2: 'CORE', 3: 'EXPERT' }[font.challengeTier];
    updateText(this.libraryDetailMeta, `${font.category.toUpperCase()}  ·  ${challengeLabel}  ·  GOOGLE FONTS`, {
      fontSize: 26, color: '#8eb6ff', weight: 600,
    });
    updateText(this.libraryPreviewSpecimen, 'LOADING TYPEFACE', {
      fontSize: 68, fontFamily: FONT_STACK, color: PALETTE.muted, weight: 550,
    });
    updateText(this.librarySelectedInfo, `${font.anatomicalFocus.toUpperCase()}\n${font.anatomicalTip}`, {
      fontSize: 27, color: '#bcd3ff', weight: 520, lineHeight: 1.15, align: 'left',
    });
    this.loadFontFamily(font.name).then((available) => {
      if (this.views.current !== ViewState.LIBRARY || this.librarySelectedFontId !== font.id) return;
      if (available) {
        updateText(this.libraryPreviewSpecimen, this.libraryGlyphMode, {
          fontSize: this.libraryGlyphMode.length > 7 ? 94 : 148,
          fontFamily: `"${font.name}"`, color: PALETTE.white, weight: 500,
        });
      } else {
        updateText(this.libraryPreviewSpecimen, 'FONT UNAVAILABLE', {
          fontSize: 68, fontFamily: FONT_STACK, color: PALETTE.red, weight: 600,
        });
      }
    });
  }

  setLibraryGlyphMode(mode) {
    this.libraryGlyphMode = mode;
    const font = this.game.fonts.find((item) => item.id === this.librarySelectedFontId);
    if (!font) return;
    this.libraryGlyphButtons.forEach((button) => {
      button.userData.spatialButton.lockedColor = button.userData.glyphMode === mode ? 'selected' : null;
      button.userData.spatialButton.visualState = null;
    });
    this.loadFontFamily(font.name).then((available) => {
      if (!available || this.librarySelectedFontId !== font.id) return;
      updateText(this.libraryPreviewSpecimen, mode, {
        fontSize: mode.length > 7 ? 94 : 148,
        fontFamily: `"${font.name}"`, color: PALETTE.white, weight: 500,
      });
    });
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
      label: '', y: -0.37, width: 1.75, height: 0.27, fontSize: 49,
      activate: () => {
        const modes = ['EASY', 'STANDARD', 'EXPERT'];
        this.settings.difficulty = modes[(modes.indexOf(this.settings.difficulty) + 1) % modes.length];
        this.refreshSettingsLabels();
      },
    });
    this.difficultyDescription = this.addLabel(view, '', {
      width: 2.35, height: 0.15, fontSize: 27, color: PALETTE.muted, weight: 500,
      x: 0, y: -0.64,
    });
    this.makeSpatialButton(view, {
      label: 'BACK', y: -0.88, width: 1.12, height: 0.21, fontSize: 42,
      activate: () => this.views.transition(ViewState.LANDING),
    });
    this.refreshSettingsLabels();
  }

  refreshSettingsLabels() {
    this.soundButton?.userData.redrawLabel(`SOUND: ${this.settings.sound ? 'ON' : 'OFF'}`, { fontSize: 50 });
    this.hapticsButton?.userData.redrawLabel(`HAPTICS: ${this.settings.haptics ? 'ON' : 'OFF'}`, { fontSize: 50 });
    this.difficultyButton?.userData.redrawLabel(`DIFFICULTY: ${this.settings.difficulty}`, { fontSize: 42 });
    const descriptions = {
      EASY: 'Tier 1 typefaces  ·  shorter specimens',
      STANDARD: 'All challenge tiers  ·  varied specimens',
      EXPERT: 'Tier 3 typefaces  ·  mixed glyph study',
    };
    if (this.difficultyDescription) {
      updateText(this.difficultyDescription, descriptions[this.settings.difficulty], { fontSize: 27, color: PALETTE.muted });
    }
  }

  buildGameView() {
    const view = this.createView(ViewState.GAME_LOOP, 2.9, 2.18, -2.35);
    this.gameHeading = this.addLabel(view, 'TYPEFACE CLASSIFICATION', {
      width: 2.0, height: 0.21, fontSize: 58, color: PALETTE.white, weight: 760, x: 0, y: 0.82,
    });
    this.roundLabel = this.addLabel(view, 'ROUND 1 / 10', {
      width: 1.0, height: 0.13, fontSize: 43, color: PALETTE.muted, weight: 550, x: -0.82, y: 0.62,
    });
    this.scoreLabel = this.addLabel(view, 'SCORE 0', {
      width: 0.96, height: 0.13, fontSize: 43, color: '#8eb6ff', weight: 550, x: 0.87, y: 0.62,
    });
    this.exitGameButton = this.makeSpatialButton(view, {
      label: 'EXIT', x: 1.19, y: 0.88, width: 0.40, height: 0.17, fontSize: 27,
      color: '#27364d', activate: () => this.game.cancel(),
    });

    // Classification round content.
    this.questionLabel = this.addLabel(view, 'SERIF OR SANS-SERIF?', {
      width: 2.1, height: 0.18, fontSize: 53, color: PALETTE.muted, weight: 520, x: 0, y: 0.39,
    });
    this.specimen = this.addLabel(view, 'TYPOGRAPHY', {
      width: 2.38, height: 0.48, fontSize: 210, color: PALETTE.white, weight: 600,
      x: 0, y: 0.03, fontFamily: FONT_STACK, padding: 16,
    });
    this.serifAnswer = this.makeSpatialButton(view, {
      label: 'SERIF', x: -0.73, y: -0.73, width: 1.12, height: 0.31, fontSize: 61,
      activate: () => this.game.answer('Serif'),
    });
    this.sansAnswer = this.makeSpatialButton(view, {
      label: 'SANS-SERIF', x: 0.73, y: -0.73, width: 1.35, height: 0.31, fontSize: 49,
      activate: () => this.game.answer('Sans-Serif'),
    });

    // Typeface Duel round content. Both specimens show the same text so the player
    // must recognize the requested family rather than compare different words.
    this.duelPromptLabel = this.addLabel(view, 'FIND THIS TYPEFACE', {
      width: 2.4, height: 0.13, fontSize: 45, color: PALETTE.muted, weight: 560, x: 0, y: 0.39,
    });
    this.duelTargetName = this.addLabel(view, 'TARGET TYPEFACE', {
      width: 2.4, height: 0.19, fontSize: 63, color: '#8eb6ff', weight: 760, x: 0, y: 0.18,
    });
    this.duelLeftPanel = createPanel(1.13, 0.58, '#142033');
    this.duelLeftPanel.position.set(-0.69, -0.22, 0.035);
    view.add(this.duelLeftPanel);
    this.duelRightPanel = createPanel(1.13, 0.58, '#142033');
    this.duelRightPanel.position.set(0.69, -0.22, 0.035);
    view.add(this.duelRightPanel);
    this.duelLeftTag = this.addLabel(view, 'A', {
      width: 0.22, height: 0.08, fontSize: 29, color: '#8eb6ff', weight: 750, x: -0.69, y: -0.01, z: 0.13,
    });
    this.duelRightTag = this.addLabel(view, 'B', {
      width: 0.22, height: 0.08, fontSize: 29, color: '#8eb6ff', weight: 750, x: 0.69, y: -0.01, z: 0.13,
    });
    this.duelLeftSpecimen = this.addLabel(view, 'Hamburgefontsiv', {
      width: 1.02, height: 0.26, fontSize: 64, color: PALETTE.white, weight: 500,
      x: -0.69, y: -0.22, z: 0.13, fontFamily: FONT_STACK, padding: 8,
    });
    this.duelRightSpecimen = this.addLabel(view, 'Hamburgefontsiv', {
      width: 1.02, height: 0.26, fontSize: 64, color: PALETTE.white, weight: 500,
      x: 0.69, y: -0.22, z: 0.13, fontFamily: FONT_STACK, padding: 8,
    });
    this.duelLeftAnswer = this.makeSpatialButton(view, {
      label: 'CHOOSE A', x: -0.69, y: -0.72, width: 1.12, height: 0.29, fontSize: 43,
      activate: () => this.game.answerDuel('LEFT'),
    });
    this.duelRightAnswer = this.makeSpatialButton(view, {
      label: 'CHOOSE B', x: 0.69, y: -0.72, width: 1.12, height: 0.29, fontSize: 43,
      activate: () => this.game.answerDuel('RIGHT'),
    });

    this.anatomyTip = this.addLabel(view, '', {
      width: 2.6, height: 0.31, fontSize: 37, color: '#c6f5e4', weight: 520,
      x: 0, y: 0.43, verticalAlign: 'middle', lineHeight: 1.15,
    });
    this.feedbackLabel = this.addLabel(view, '', {
      width: 2.55, height: 0.17, fontSize: 48, color: PALETTE.white, weight: 750, x: 0, y: -0.48,
    });
    this.retryButton = this.makeSpatialButton(view, {
      label: 'RETRY', x: -0.68, y: -0.73, width: 1.08, height: 0.31, fontSize: 52,
      color: '#234f91', activate: () => this.game.start(),
    });
    this.homeButton = this.makeSpatialButton(view, {
      label: 'MAIN MENU', x: 0.68, y: -0.73, width: 1.12, height: 0.31, fontSize: 45,
      activate: () => this.views.transition(ViewState.LANDING),
    });

    this.retryButton.visible = false;
    this.homeButton.visible = false;
    this.exitGameButton.visible = true;
    this.setClassificationVisible(false);
    this.setDuelVisible(false);
    this.anatomyTip.visible = false;
    this.feedbackLabel.visible = false;
    this.setAnswerButtonState(this.serifAnswer, { disabled: true, color: null });
    this.setAnswerButtonState(this.sansAnswer, { disabled: true, color: null });
    this.setAnswerButtonState(this.duelLeftAnswer, { disabled: true, color: null });
    this.setAnswerButtonState(this.duelRightAnswer, { disabled: true, color: null });
  }

  setClassificationVisible(visible) {
    for (const item of [this.questionLabel, this.specimen, this.serifAnswer, this.sansAnswer]) {
      if (item) item.visible = Boolean(visible);
    }
  }

  setDuelVisible(visible) {
    for (const item of [
      this.duelPromptLabel, this.duelTargetName, this.duelLeftPanel, this.duelRightPanel,
      this.duelLeftTag, this.duelRightTag, this.duelLeftSpecimen, this.duelRightSpecimen,
      this.duelLeftAnswer, this.duelRightAnswer,
    ]) {
      if (item) item.visible = Boolean(visible);
    }
  }

  showPreparingState(difficulty, gameMode = 'CLASSIFICATION') {
    updateText(this.roundLabel, 'VERIFYING TYPEFACES', { fontSize: 37, color: PALETTE.muted });
    updateText(this.scoreLabel, 'SCORE 0', { fontSize: 43, color: '#8eb6ff' });
    this.retryButton.visible = false;
    this.homeButton.visible = false;
    this.exitGameButton.visible = true;
    this.setClassificationVisible(false);
    this.setDuelVisible(false);
    this.anatomyTip.visible = false;
    this.feedbackLabel.visible = true;
    updateText(this.gameHeading, gameMode === 'DUEL' ? 'TYPEFACE DUEL' : 'TYPEFACE CLASSIFICATION', { fontSize: 65 });
    updateText(this.questionLabel, `${difficulty} MODE  ·  PREPARING SESSION`, { fontSize: 45, color: PALETTE.muted });
    this.specimen.visible = true;
    updateText(this.specimen, 'VERIFYING\nTYPEFACES', {
      fontSize: 142, fontFamily: FONT_STACK, color: PALETTE.white, weight: 700,
    });
    updateText(this.feedbackLabel, 'CHECKING GOOGLE FONTS AVAILABILITY', {
      fontSize: 35, color: '#8eb6ff', weight: 620,
    });
  }

  showFontPreparationError(message) {
    updateText(this.roundLabel, 'FONT VERIFICATION', { fontSize: 37, color: PALETTE.red });
    updateText(this.scoreLabel, 'NOT STARTED', { fontSize: 38, color: PALETTE.muted });
    this.setClassificationVisible(false);
    this.setDuelVisible(false);
    this.retryButton.visible = true;
    this.homeButton.visible = true;
    this.exitGameButton.visible = false;
    this.specimen.visible = false;
    this.anatomyTip.visible = false;
    this.questionLabel.visible = true;
    this.feedbackLabel.visible = true;
    updateText(this.questionLabel, 'FONT VERIFICATION FAILED', { fontSize: 49, color: PALETTE.red });
    updateText(this.feedbackLabel, `${message}\nConnect to the internet and retry. No substitute typeface will be shown.`, {
      fontSize: 31, color: PALETTE.white, weight: 550, lineHeight: 1.2,
    });
  }

  renderRound({ font, word, number, total, score, specimenFontSize, difficulty }) {
    this.retryButton.visible = false;
    this.homeButton.visible = false;
    this.exitGameButton.visible = true;
    this.setDuelVisible(false);
    this.setClassificationVisible(true);
    this.activeSpecimenFontId = font.id;
    this.currentRoundFont = font;
    this.currentRoundWord = word;
    updateText(this.gameHeading, 'TYPEFACE CLASSIFICATION', { fontSize: 65 });
    updateText(this.roundLabel, `ROUND ${number} / ${total}`, { fontSize: 43, color: PALETTE.muted });
    updateText(this.scoreLabel, `SCORE ${score}`, { fontSize: 43, color: '#8eb6ff' });
    updateText(this.questionLabel, `${difficulty}  ·  SERIF OR SANS-SERIF?`, { fontSize: 45, color: PALETTE.muted });
    updateText(this.specimen, word, {
      fontSize: specimenFontSize, fontFamily: `"${font.name}"`, color: PALETTE.white, weight: 500,
      lineHeight: 1.16,
    });
    this.specimen.visible = true;
    this.anatomyTip.visible = false;
    this.feedbackLabel.visible = false;
    this.setAnswerButtonState(this.serifAnswer, { disabled: false, color: null });
    this.setAnswerButtonState(this.sansAnswer, { disabled: false, color: null });
  }

  renderDuelRound({ target, left, right, word, number, total, score, specimenFontSize, difficulty }) {
    this.retryButton.visible = false;
    this.homeButton.visible = false;
    this.exitGameButton.visible = true;
    this.setClassificationVisible(false);
    this.setDuelVisible(true);
    this.currentDuel = { target, left, right, word };
    updateText(this.gameHeading, 'TYPEFACE DUEL', { fontSize: 68 });
    updateText(this.roundLabel, `ROUND ${number} / ${total}`, { fontSize: 43, color: PALETTE.muted });
    updateText(this.scoreLabel, `SCORE ${score}`, { fontSize: 43, color: '#8eb6ff' });
    updateText(this.duelPromptLabel, `${difficulty}  ·  FIND THIS TYPEFACE`, { fontSize: 41, color: PALETTE.muted });
    updateText(this.duelTargetName, target.name.toUpperCase(), {
      fontSize: target.name.length > 18 ? 48 : 61, color: '#8eb6ff', weight: 780,
    });
    updateText(this.duelLeftTag, 'A', { fontSize: 29, color: '#8eb6ff', weight: 750 });
    updateText(this.duelRightTag, 'B', { fontSize: 29, color: '#8eb6ff', weight: 750 });
    updateText(this.duelLeftSpecimen, word, {
      fontSize: specimenFontSize, fontFamily: `"${left.name}"`, color: PALETTE.white, weight: 500,
    });
    updateText(this.duelRightSpecimen, word, {
      fontSize: specimenFontSize, fontFamily: `"${right.name}"`, color: PALETTE.white, weight: 500,
    });
    this.anatomyTip.visible = false;
    this.feedbackLabel.visible = false;
    this.setAnswerButtonState(this.duelLeftAnswer, { disabled: false, color: null });
    this.setAnswerButtonState(this.duelRightAnswer, { disabled: false, color: null });
  }

  redrawSpecimen(font) {
    if (!font || !this.currentRoundWord) return;
    updateText(this.specimen, this.currentRoundWord, {
      fontSize: this.game.rules.specimenFontSize,
      fontFamily: `"${font.name}"`, color: PALETTE.white, weight: 500,
    });
  }

  setAnswerButtonState(button, { disabled, color }) {
    const state = button.userData.spatialButton;
    state.disabled = Boolean(disabled);
    state.lockedColor = color;
    state.visualState = null;
  }

  showAnswerFeedback({ chosen, correctCategory, isCorrect, tip, focus, fontName, score }) {
    this.specimen.visible = true;
    this.questionLabel.visible = false;
    this.anatomyTip.visible = true;
    this.feedbackLabel.visible = true;
    updateText(this.anatomyTip, `${focus.toUpperCase()}  ·  ${tip}`, {
      fontSize: 34, color: '#baf2dd', weight: 520, lineHeight: 1.13,
    });
    const feedback = isCorrect
      ? `CORRECT  ·  ${fontName}`
      : `NOT QUITE  ·  ${fontName}  ·  ${correctCategory.toUpperCase()}`;
    updateText(this.feedbackLabel, feedback, {
      fontSize: 43, color: isCorrect ? PALETTE.green : PALETTE.red, weight: 780,
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

  showDuelFeedback({ chosen, correctAnswer, isCorrect, targetName, otherName, tip, focus, score }) {
    this.duelPromptLabel.visible = false;
    this.duelTargetName.visible = true;
    this.anatomyTip.visible = true;
    this.feedbackLabel.visible = true;
    updateText(this.duelTargetName, `TARGET: ${targetName.toUpperCase()}`, {
      fontSize: targetName.length > 17 ? 44 : 54, color: '#8eb6ff', weight: 760,
    });
    updateText(this.anatomyTip, `${focus.toUpperCase()}  ·  ${tip}`, {
      fontSize: 31, color: '#baf2dd', weight: 520, lineHeight: 1.12,
    });
    updateText(this.feedbackLabel, `${isCorrect ? 'CORRECT' : 'NOT QUITE'}  ·  OTHER FACE: ${otherName.toUpperCase()}`, {
      fontSize: 32, color: isCorrect ? PALETTE.green : PALETTE.red, weight: 760,
    });
    updateText(this.scoreLabel, `SCORE ${score}`, { fontSize: 43, color: '#8eb6ff' });
    this.setAnswerButtonState(this.duelLeftAnswer, {
      disabled: true,
      color: correctAnswer === 'LEFT' ? 'selected' : (chosen === 'LEFT' ? 'incorrect' : 'disabled'),
    });
    this.setAnswerButtonState(this.duelRightAnswer, {
      disabled: true,
      color: correctAnswer === 'RIGHT' ? 'selected' : (chosen === 'RIGHT' ? 'incorrect' : 'disabled'),
    });
  }

  buildGameOverView() {
    const view = this.createView(ViewState.GAME_OVER, 2.9, 2.05, -2.35);
    this.addLabel(view, 'BATTLE COMPLETE', {
      width: 2.55, height: 0.27, fontSize: 83, color: PALETTE.white, weight: 780, x: 0, y: 0.72,
    });
    this.gameOverSummary = this.addLabel(view, '', {
      width: 2.45, height: 0.43, fontSize: 68, color: '#bcd3ff', weight: 650, x: 0, y: 0.34,
    });
    this.highScoresLabel = this.addLabel(view, '', {
      width: 2.55, height: 0.48, fontSize: 39, color: PALETTE.muted, weight: 520,
      x: 0, y: -0.17, lineHeight: 1.22,
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
    updateText(this.gameOverSummary, `${record.score} POINTS  ·  ${record.difficulty}\n${record.gameMode === 'DUEL' ? 'TYPEFACE DUEL' : 'CLASSIFICATION'}\n${record.correct}/${record.total} CORRECT  ·  ${record.accuracy}%`, {
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

    const safeFamily = String(name).replace(/[\u0000-\u001f"<>]/gu, '').trim();
    const query = new URLSearchParams({ family: safeFamily, display: 'swap' });
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${query.toString()}`;

    let settle;
    let settled = false;
    const promise = new Promise((resolve) => { settle = resolve; });
    const complete = (available) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (!available) link.remove();
      settle(Boolean(available));
    };
    const timeoutId = window.setTimeout(() => complete(false), 12000);

    link.onload = async () => {
      try {
        const faces = await document.fonts.load(`400 128px "${safeFamily}"`, 'Hamburgefontsiv AaGgRr 0123456789');
        const matchingFace = faces.some((face) => face.family.replace(/["']/gu, '') === safeFamily);
        const browserConfirmed = document.fonts.check(`400 128px "${safeFamily}"`, 'Hamburgefontsiv');
        complete(matchingFace && browserConfirmed);
      } catch {
        complete(false);
      }
    };
    link.onerror = () => complete(false);
    this.fontLoadPromises.set(name, promise);
    document.head.appendChild(link);

    const available = await promise;
    if (!available) this.fontLoadPromises.delete(name);
    return available;
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
