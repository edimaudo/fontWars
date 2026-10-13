import { System, Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } from '@iwsdk/core';

export class FontGameSystem extends System {
  initialize() {
    console.log("FontGameSystem initialized in 3D spatial space.");
    
    // User-provided word dataset integration
    this.WORDS = [
      "aardvark", "abacus", "abandon", "abate", "abbey", "abdomen", 
      "abduct", "aberrant", "abhor", "abide", "ability", "abject", 
      "ablaze", "abolish", "abort", "abound", "above", "absent", "absolute"
    ];

    // Curated 400-Font Library data models (200 Serif / 200 Sans-Serif)
    this.FONT_DATABASE = [];
    for (let i = 1; i <= 200; i++) {
      this.FONT_DATABASE.push({ name: `Sans Typeface ${i}`, category: "Sans-Serif", tip: "Clean unadorned terminals and uniform stroke weight." });
      this.FONT_DATABASE.push({ name: `Serif Typeface ${i}`, category: "Serif", tip: "Structured foot serifs and high-contrast stroke transitions." });
    }

    this.score = 0;
    this.currentRound = 0;
    this.totalRounds = 10;
    this.isFeedbackActive = false;

    // Setup initial 3D spatial UI elements and lighting anchors
    this.setupSpatialScene();
    this.spawnNextRound();
  }

  setupSpatialScene() {
    // Create a floating 3D informational panel for the title / score display
    const panelGeo = new BoxGeometry(1.5, 0.8, 0.05);
    const panelMat = new MeshStandardMaterial({ color: 0x111827, roughness: 0.2 });
    this.scorePanel = new Mesh(panelGeo, panelMat);
    this.scorePanel.position.set(0, 1.8, -2.0);
    this.query.world.createTransformEntity(this.scorePanel);

    // Target Word 3D Display Mesh holder
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

    // Pick random word and fonts
    const randomWord = this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
    const correctFont = this.FONT_DATABASE[Math.floor(Math.random() * this.FONT_DATABASE.length)];
    let incorrectFont;
    do {
      incorrectFont = this.FONT_DATABASE[Math.floor(Math.random() * this.FONT_DATABASE.length)];
    } while (incorrectFont.name === correctFont.name);

    console.log(`Round ${this.currentRound}: Target Word [${randomWord}] | Correct Font Family: ${correctFont.name}`);
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

    // Enforce 2.5-second spatial feedback pause before loading next round
    setTimeout(() => {
      this.spawnNextRound();
    }, 2500);
  }

  update(dt) {
    // Continuous 60fps ECS system update loop for XR tracking and spatial interaction state
  }
}
