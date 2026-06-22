// game.js - Complete Phaser Webview Logic for fontWars

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#ffffff',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// --- Game State ---
let currentTheme = 'light';
let score = 0;
let questionCount = 0;
let maxQuestions = 10;
let timerEvent;
let timeElapsed = 0;
let topScore = 0;
let topTime = 0;
let isPlaying = false;

// --- Professional Font Library ---
// Filtered to remove amateur fonts and restricted to regular weights
const fontLibrary = [
    { name: 'Helvetica', type: 'sans-serif', hint: 'Look for the horizontal terminals on the lowercase a, c, e, and g.' },
    { name: 'Arial', type: 'sans-serif', hint: 'Notice the diagonal cut on the terminals of the lowercase t and c.' },
    { name: 'Futura', type: 'sans-serif', hint: 'Characterized by near-perfect circles and sharp, geometric precision.' },
    { name: 'Gill Sans', type: 'sans-serif', hint: 'Check the classic roman proportions and the flat top of the lowercase t.' },
    { name: 'Times New Roman', type: 'serif', hint: 'Check the narrow, pointed serifs and high stroke contrast.' },
    { name: 'Baskerville', type: 'serif', hint: 'Observe the open, unclosed tail on the lowercase g and sharp serifs.' },
    { name: 'Garamond', type: 'serif', hint: 'Look for the small eye in the lowercase e and scooped serifs.' },
    { name: 'Bodoni', type: 'serif', hint: 'Extreme contrast between thick and thin strokes with unbracketed serifs.' }
];

let currentCorrectFont = null;

function preload() {
    // No decorative assets loaded to maintain a clean, professional UI
}

function create() {
    this.cameras.main.setBackgroundColor(getThemeColor('background'));

    // Top UI Bar
    this.scoreText = this.add.text(20, 20, 'Score: 0', getTextStyle('standard'));
    this.questionText = this.add.text(20, 60, 'Question: 0/10', getTextStyle('standard'));
    this.timerText = this.add.text(window.innerWidth - 150, 20, 'Time: 0:00', getTextStyle('standard'));
    
    // Main Display Text
    this.displayFontText = this.add.text(window.innerWidth / 2, window.innerHeight / 3.5, 'Ag', {
        fontSize: '140px',
        color: getThemeColor('text'),
        align: 'center'
    }).setOrigin(0.5);

    // Flashcard Hint Text (Hidden by default)
    this.hintText = this.add.text(window.innerWidth / 2, window.innerHeight / 2.3, '', {
        fontSize: '20px',
        color: getThemeColor('text'),
        align: 'center',
        wordWrap: { width: window.innerWidth - 40 }
    }).setOrigin(0.5).setVisible(false);

    // Accessible Answer Buttons
    this.buttonA = createButton(this, window.innerWidth / 2, window.innerHeight / 2 + 50, 'Option A', () => checkAnswer(0));
    this.buttonB = createButton(this, window.innerWidth / 2, window.innerHeight / 2 + 150, 'Option B', () => checkAnswer(1));

    // Listen for Devvit Messages
    window.addEventListener('message', handleDevvitMessage.bind(this));

    startGame(this);
}

function update() {
    // Resize handled by Phaser Scale Manager
}

function startGame(scene) {
    score = 0;
    questionCount = 0;
    timeElapsed = 0;
    isPlaying = true;
    
    scene.scoreText.setText(`Score: ${score}`);
    scene.questionText.setText(`Question: ${questionCount}/${maxQuestions}`);
    scene.timerText.setText('Time: 0:00');

    if (timerEvent) timerEvent.remove();
    timerEvent = scene.time.addEvent({ delay: 1000, callback: updateTimer, callbackScope: scene, loop: true });

    loadNextQuestion(scene);
}

function updateTimer() {
    if (!isPlaying) return;
    timeElapsed++;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
}

function loadNextQuestion(scene) {
    if (questionCount >= maxQuestions) {
        endGame(scene);
        return;
    }

    scene.buttonA.rect.setInteractive();
    scene.buttonB.rect.setInteractive();

    const shuffled = Phaser.Utils.Array.Shuffle([...fontLibrary]);
    currentCorrectFont = shuffled[0];
    const incorrectFont = shuffled[1];

    scene.displayFontText.setFontFamily(currentCorrectFont.name);
    scene.displayFontText.setFontStyle('normal'); // Forcing regular weight
    
    const answers = Phaser.Utils.Array.Shuffle([currentCorrectFont.name, incorrectFont.name]);
    
    scene.buttonA.text.setText(answers[0]);
    scene.buttonA.isCorrect = (answers[0] === currentCorrectFont.name);
    
    scene.buttonB.text.setText(answers[1]);
    scene.buttonB.isCorrect = (answers[1] === currentCorrectFont.name);

    scene.buttonA.rect.setFillStyle(getThemeColor('buttonBg', true));
    scene.buttonB.rect.setFillStyle(getThemeColor('buttonBg', true));
}

function checkAnswer(buttonIndex) {
    const scene = game.scene.scenes[0];
    const selectedButton = buttonIndex === 0 ? scene.buttonA : scene.buttonB;
    
    // Prevent double clicking
    scene.buttonA.rect.disableInteractive();
    scene.buttonB.rect.disableInteractive();

    if (selectedButton.isCorrect) {
        score++;
        questionCount++;
        scene.scoreText.setText(`Score: ${score}`);
        scene.questionText.setText(`Question: ${questionCount}/${maxQuestions}`);
        loadNextQuestion(scene);
    } else {
        // Flashcard Educational Feedback
        selectedButton.rect.setFillStyle(0xd32f2f); // WCAG Red
        const correctButton = scene.buttonA.isCorrect ? scene.buttonA : scene.buttonB;
        correctButton.rect.setFillStyle(0x388e3c); // WCAG Green

        questionCount++;
        scene.questionText.setText(`Question: ${questionCount}/${maxQuestions}`);

        scene.hintText.setText(`Tip: ${currentCorrectFont.hint}`);
        scene.hintText.setVisible(true);

        // 2-second delay to allow user to read the tip and correct answer
        scene.time.delayedCall(2000, () => {
            scene.hintText.setVisible(false);
            loadNextQuestion(scene);
        });
    }
}

function endGame(scene) {
    isPlaying = false;
    timerEvent.remove();

    if (score > topScore) {
        topScore = score;
        topTime = timeElapsed;
    }

    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    
    window.parent.postMessage({
        type: 'GAME_OVER',
        payload: {
            score: score,
            time: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`,
            topScore: topScore
        }
    }, '*');
}

// --- UI & Accessibility Helpers ---
function createButton(scene, x, y, text, onClick) {
    const rect = scene.add.rectangle(x, y, 400, 80, getThemeColor('buttonBg', true))
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, getThemeColor('buttonBorder', true));

    const btnText = scene.add.text(x, y, text, getTextStyle('button'))
        .setOrigin(0.5);

    rect.on('pointerdown', onClick);

    return { rect, text: btnText };
}

function handleDevvitMessage(event) {
    const { type, payload } = event.data;
    const scene = game.scene.scenes[0];

    if (type === 'TOGGLE_THEME') {
        currentTheme = payload.theme;
        scene.cameras.main.setBackgroundColor(getThemeColor('background'));
        scene.scoreText.setColor(getThemeColor('text'));
        scene.questionText.setColor(getThemeColor('text'));
        scene.timerText.setColor(getThemeColor('text'));
        scene.displayFontText.setColor(getThemeColor('text'));
        scene.hintText.setColor(getThemeColor('text'));
        
        scene.buttonA.rect.setFillStyle(getThemeColor('buttonBg', true));
        scene.buttonB.rect.setFillStyle(getThemeColor('buttonBg', true));
        scene.buttonA.rect.setStrokeStyle(2, getThemeColor('buttonBorder', true));
        scene.buttonB.rect.setStrokeStyle(2, getThemeColor('buttonBorder', true));
        
        scene.buttonA.text.setColor(getThemeColor('buttonText'));
        scene.buttonB.text.setColor(getThemeColor('buttonText'));
    }

    if (type === 'APP_EXIT') {
        isPlaying = false;
        if (timerEvent) timerEvent.remove();
    }
}

function getThemeColor(element, isHex = false) {
    const themes = {
        light: {
            background: 0xffffff,
            text: '#1a1a1a', 
            buttonBg: 0x005bbb, 
            buttonText: '#ffffff',
            buttonBorder: 0x003f82
        },
        dark: {
            background: 0x121212,
            text: '#f5f5f5',
            buttonBg: 0x4fc3f7, 
            buttonText: '#000000',
            buttonBorder: 0x29b6f6
        }
    };
    
    const color = themes[currentTheme][element];
    return isHex ? color : (typeof color === 'string' ? color : `#${color.toString(16)}`);
}

function getTextStyle(type) {
    if (type === 'standard') {
        return { fontSize: '24px', color: getThemeColor('text'), fontFamily: 'system-ui, sans-serif' };
    }
    if (type === 'button') {
        return { fontSize: '28px', color: getThemeColor('buttonText'), fontFamily: 'system-ui, sans-serif', fontStyle: 'bold' };
    }
}
