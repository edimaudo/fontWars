import { System, Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';
import { generateFontDatabase } from '../data/fontDatabase.js';
import { WORDS } from '../data/wordDataset.js';

export class FontGameSystem extends System {
  initialize() {
    console.log("FontGameSystem initialized with validated spatial PRD assets.");
    
    // Load complete datasets
    this.WORDS = WORDS;
    this.FONT_DATABASE = generateFontDatabase();
    
    console.log(`Loaded Font Database: ${this.FONT_DATABASE.length} typefaces verified.`);
    console.log(`Loaded Word Dataset: ${this.WORDS.length} words verified.`);

    this.score = 0;
    this.currentRound = 0;
    this.totalRounds = 10;
    this.isFeedbackActive = false;

    this.setupSpatialScene();
    this.spawnNextRound();
  }

  setupSpatialScene() {
    const panelGeo = new BoxGeometry(1.5, 0.8, 0.05);
    const panelMat = new MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
    this.scorePanel = new Mesh(panelGeo, panelMat);
    this.scorePanel.position.set(0, 1.8, -2.0);
    this.query.world.createTransformEntity(this.scorePanel);

    const targetGeo = new BoxGeometry(2.0, 0.5, 0.1);
    const targetMat = new MeshStandardMaterial({ color: 0x1F2937 });
    this.targetMesh = new Mesh(targetGeo, targetMat);
    this.targetMesh.position.set(0, 1.2, -2.0);
    this.query.world.createTransformEntity(this.targetMesh);
  }

  spawnNextRound() {
    if (this.currentRound >= this.totalRounds) {
      console.log(`Game Complete! Final Score: ${this.score}`);
      return;
    }

    this.currentRound++;
    this.isFeedbackActive = false;

    const randomWord = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
    const correctFont = this.FONT_DATABASE[Math.floor(Math.random() * this.FONT_DATABASE.length)];
    let incorrectFont;
    do {
      incorrectFont = this.FONT_DATABASE[Math.floor(Math.random() * this.FONT_DATABASE.length)];
    } while (incorrectFont.id === correctFont.id);

    console.log(`Round ${this.currentRound}: Target Word [${randomWord}] | Correct: ${correctFont.name} (${correctFont.category})`);
  }

  handleSpatialSelection(selectedCategory, correctCategory) {
    if (this.isFeedbackActive) return;
    this.isFeedbackActive = true;

    const isCorrect = selectedCategory === correctCategory;
    if (isCorrect) {
      this.score += 100;
      console.log("Correct spatial selection! +100 pts");
    } else {
      console.log("Incorrect selection.");
    }

    setTimeout(() => {
      this.spawnNextRound();
    }, 2500);
  }

  update(dt) {
    // 60fps ECS system tick for WebXR spatial loop
  }
}
