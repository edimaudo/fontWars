import { System, Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } from '@iwsdk/core';
import { SpatialButton } from '../components/SpatialButton.js';

export const ViewState = {
  LANDING: 'LANDING',
  LIBRARY: 'LIBRARY',
  SETTINGS: 'SETTINGS',
  GAME_LOOP: 'GAME_LOOP',
  GAME_OVER: 'GAME_OVER'
};

export class SpatialViewStateManager extends System {
  initialize() {
    console.log("SpatialViewStateManager initialized.");
    
    this.currentState = null;
    this.viewEntities = [];
    this.registeredButtons = [];

    // Settings State Variables
    this.settings = {
      difficulty: 'NORMAL', // 'EASY' (5s delay), 'NORMAL', 'HARD' (1s delay)
      soundEnabled: true,
      hapticsEnabled: true
    };

    // Transition to initial Landing View
    this.transitionTo(ViewState.LANDING);
  }

  clearActiveView() {
    // Unregister and destroy spatial buttons
    this.registeredButtons.forEach(btn => btn.destroy());
    this.registeredButtons = [];

    // Destroy active 3D panel entities in the world
    this.viewEntities.forEach(entity => {
      this.query.world.destroyEntity(entity);
    });
    this.viewEntities = [];
  }

  transitionTo(newState, extraData = {}) {
    if (this.currentState === newState && newState !== ViewState.GAME_OVER) return;

    console.log(`Transitioning Spatial View: ${this.currentState} -> ${newState}`);
    this.clearActiveView();
    this.currentState = newState;

    switch (newState) {
      case ViewState.LANDING:
        this.renderLandingView();
        break;
      case ViewState.LIBRARY:
        this.renderLibraryView();
        break;
      case ViewState.SETTINGS:
        this.renderSettingsView();
        break;
      case ViewState.GAME_LOOP:
        this.renderGameLoopView();
        break;
      case ViewState.GAME_OVER:
        this.renderGameOverView(extraData.finalScore || 0);
        break;
      default:
        console.error(`Unknown view state: ${newState}`);
    }
  }

  // --- 1. LANDING VIEW ---
  renderLandingView() {
    // Spatial Backdrop Title Panel
    const titlePanelGeo = new BoxGeometry(2.2, 0.8, 0.08);
    const titlePanelMat = new MeshStandardMaterial({ color: 0x1E1E2E, roughness: 0.2 });
    const titleMesh = new Mesh(titlePanelGeo, titlePanelMat);
    titleMesh.position.set(0, 1.8, -2.2);
    const titleEntity = this.query.world.createTransformEntity(titleMesh);
    this.viewEntities.push(titleEntity);

    // Navigation Buttons in 3D Space
    const startBtn = new SpatialButton(
      this.query.world,
      "START BATTLE",
      new Vector3(0, 1.2, -2.0),
      () => this.transitionTo(ViewState.GAME_LOOP)
    );

    const libraryBtn = new SpatialButton(
      this.query.world,
      "FONT LIBRARY",
      new Vector3(-0.9, 0.8, -2.0),
      () => this.transitionTo(ViewState.LIBRARY)
    );

    const settingsBtn = new SpatialButton(
      this.query.world,
      "SETTINGS",
      new Vector3(0.9, 0.8, -2.0),
      () => this.transitionTo(ViewState.SETTINGS)
    );

    this.registeredButtons.push(startBtn, libraryBtn, settingsBtn);
    this.syncWithInteractionSystem();
  }

  // --- 2. FONT LIBRARY CATALOG VIEW ---
  renderLibraryView() {
    const libPanelGeo = new BoxGeometry(2.8, 1.6, 0.08);
    const libPanelMat = new MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    const libMesh = new Mesh(libPanelGeo, libPanelMat);
    libMesh.position.set(0, 1.5, -2.2);
    const libEntity = this.query.world.createTransformEntity(libMesh);
    this.viewEntities.push(libEntity);

    const backBtn = new SpatialButton(
      this.query.world,
      "BACK TO MAIN",
      new Vector3(0, 0.5, -2.0),
      () => this.transitionTo(ViewState.LANDING)
    );

    this.registeredButtons.push(backBtn);
    this.syncWithInteractionSystem();
  }

  // --- 3. SETTINGS VIEW ---
  renderSettingsView() {
    const settingsPanelGeo = new BoxGeometry(2.0, 1.4, 0.08);
    const settingsPanelMat = new MeshStandardMaterial({ color: 0x1F2937, roughness: 0.2 });
    const settingsMesh = new Mesh(settingsPanelGeo, settingsPanelMat);
    settingsMesh.position.set(0, 1.6, -2.2);
    const settingsEntity = this.query.world.createTransformEntity(settingsMesh);
    this.viewEntities.push(settingsEntity);

    // Toggle Sound Button
    const soundLabel = `SOUND: ${this.settings.soundEnabled ? 'ON' : 'OFF'}`;
    const soundBtn = new SpatialButton(
      this.query.world,
      soundLabel,
      new Vector3(0, 1.8, -2.0),
      () => {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        this.transitionTo(ViewState.SETTINGS); // Re-render setting state
      }
    );

    // Back to Main Menu Button
    const backBtn = new SpatialButton(
      this.query.world,
      "MAIN MENU",
      new Vector3(0, 0.6, -2.0),
      () => this.transitionTo(ViewState.LANDING)
    );

    this.registeredButtons.push(soundBtn, backBtn);
    this.syncWithInteractionSystem();
  }

  // --- 4. GAME LOOP VIEW ---
  renderGameLoopView() {
    // Notify FontGameSystem to reset score and load Round 1
    const fontGameSystem = this.query.world.getSystem('FontGameSystem');
    if (fontGameSystem) {
      fontGameSystem.startNewSession();
    }

    // Return to Menu Exit Button
    const exitBtn = new SpatialButton(
      this.query.world,
      "EXIT GAME",
      new Vector3(-1.2, 2.2, -2.0),
      () => this.transitionTo(ViewState.LANDING)
    );

    this.registeredButtons.push(exitBtn);
    this.syncWithInteractionSystem();
  }

  // --- 5. GAME OVER MODAL ---
  renderGameOverView(finalScore) {
    const gameOverPanelGeo = new BoxGeometry(2.0, 1.2, 0.08);
    const gameOverPanelMat = new MeshStandardMaterial({ color: 0x0F172A, roughness: 0.1 });
    const gameOverMesh = new Mesh(gameOverPanelGeo, gameOverPanelMat);
    gameOverMesh.position.set(0, 1.6, -2.0);
    const gameOverEntity = this.query.world.createTransformEntity(gameOverMesh);
    this.viewEntities.push(gameOverEntity);

    const playAgainBtn = new SpatialButton(
      this.query.world,
      "PLAY AGAIN",
      new Vector3(-0.6, 1.0, -1.8),
      () => this.transitionTo(ViewState.GAME_LOOP)
    );

    const menuBtn = new SpatialButton(
      this.query.world,
      "MAIN MENU",
      new Vector3(0.6, 1.0, -1.8),
      () => this.transitionTo(ViewState.LANDING)
    );

    this.registeredButtons.push(playAgainBtn, menuBtn);
    this.syncWithInteractionSystem();
  }

  syncWithInteractionSystem() {
    const interactionSystem = this.query.world.getSystem('SpatialInteractionSystem');
    if (interactionSystem) {
      interactionSystem.clearButtons();
      this.registeredButtons.forEach(btn => interactionSystem.registerButton(btn));
    }
  }

  update(dt) {
    // Continuous 60fps view state tick
  }
}
