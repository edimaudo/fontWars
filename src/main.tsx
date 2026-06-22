import { Devvit, useState } from '@devvit/public-api';

// Enable necessary capabilities
Devvit.configure({
  redditAPI: true,
  redis: true,
});

Devvit.addCustomPostType({
  name: 'fontWars',
  height: 'tall',
  render: (context) => {
    // --- State Management ---
    // Controls which screen the user is currently viewing
    const [page, setPage] = useState('landing');
    // Controls the global theme (defaults to light mode)
    const [theme, setTheme] = useState('light'); 
    // Tracks the highest score achieved in the current session
    const [topScore, setTopScore] = useState(0);

    // --- Styling Constants ---
    // Enforcing strict WCAG 2.1 contrast compliance based on the active theme
    const colors = {
      background: theme === 'light' ? '#FFFFFF' : '#121212',
      textPrimary: theme === 'light' ? '#1A1A1A' : '#F5F5F5',
      textSecondary: theme === 'light' ? '#4D4D4D' : '#B3B3B3',
      buttonBg: theme === 'light' ? '#005BBB' : '#4FC3F7',
      buttonText: theme === 'light' ? '#FFFFFF' : '#000000',
    };

    // --- Page Components ---

    const LandingPage = () => (
      <vstack height="100%" width="100%" alignment="center middle" backgroundColor={colors.background} padding="large">
        <text size="xxlarge" weight="bold" color={colors.textPrimary} padding="medium">
          fontWars
        </text>
        <text size="medium" color={colors.textSecondary} padding="small">
          Prove your typographical skill.
        </text>
        <text size="large" weight="bold" color={colors.textPrimary} padding="medium">
          Top Score: {topScore}
        </text>
        <vstack gap="medium" padding="large">
          <button appearance="primary" onPress={() => setPage('game')}>Play Game</button>
          <button appearance="secondary" onPress={() => setPage('about')}>About</button>
          <button appearance="secondary" onPress={() => setPage('library')}>Font Library</button>
          <button appearance="secondary" onPress={() => setPage('settings')}>Settings</button>
        </vstack>
      </vstack>
    );

    const AboutPage = () => (
      <vstack height="100%" width="100%" backgroundColor={colors.background} padding="large">
        <text size="xlarge" weight="bold" color={colors.textPrimary} padding="medium">
          About fontWars
        </text>
        <text size="medium" color={colors.textPrimary} wrap={true} padding="small">
          Can you spot the differences between Arial and Helvetica? Times New Roman and Baskerville? Prove it.
        </text>
        <text size="medium" color={colors.textPrimary} wrap={true} padding="small">
          fontWars is a game of typographical skill that helps you level up. Flaunt your keen eye, obsess over your stats, and battle your way to the number one spot.
        </text>
        <text size="medium" weight="bold" color={colors.textPrimary} wrap={true} padding="small">
          WARNING: FontWars is insanely addictive. Please use responsibly.
        </text>
        <text size="medium" color={colors.textPrimary} wrap={true} padding="small">
          • Track your progress as you level up
        </text>
        <text size="medium" color={colors.textPrimary} wrap={true} padding="small">
          • Easily view your ranking
        </text>
        <text size="medium" color={colors.textPrimary} wrap={true} padding="small">
          • Train as you play: Typewar acts as multiplayer flash cards for improving your type-spotting acumen
        </text>
        <spacer size="large" />
        <button appearance="secondary" onPress={() => setPage('landing')}>Back to Menu</button>
      </vstack>
    );

    const SettingsPage = () => (
      <vstack height="100%" width="100%" alignment="center middle" backgroundColor={colors.background} padding="large">
        <text size="xlarge" weight="bold" color={colors.textPrimary} padding="medium">
          Game Settings
        </text>
        <hstack gap="medium" alignment="middle" padding="medium">
          <text size="medium" color={colors.textPrimary}>Current Theme:</text>
          <text size="medium" weight="bold" color={colors.textPrimary}>
            {theme.toUpperCase()}
          </text>
        </hstack>
        <button 
          appearance="primary" 
          onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          Toggle Light/Dark Mode
        </button>
        <spacer size="large" />
        <button appearance="secondary" onPress={() => setPage('landing')}>Back to Menu</button>
      </vstack>
    );

    const LibraryPage = () => (
      <vstack height="100%" width="100%" backgroundColor={colors.background} padding="large">
        <text size="xlarge" weight="bold" color={colors.textPrimary} padding="medium">
          Font Library & Flashcards
        </text>
        <text size="medium" color={colors.textSecondary} wrap={true} padding="small">
          Learn which stylistic elements to key in on to improve your identification skills.
        </text>
        <spacer size="medium" />
        
        {/* Sample of the library flashcard output */}
        <vstack gap="small" padding="small" border="thick" borderColor={colors.textSecondary}>
          <text size="large" weight="bold" color={colors.textPrimary}>Helvetica (Sans-Serif)</text>
          <text size="medium" color={colors.textPrimary} wrap={true}>
            Look for the horizontal terminals on the lowercase a, c, e, and g.
          </text>
        </vstack>
        
        <spacer size="small" />

        <vstack gap="small" padding="small" border="thick" borderColor={colors.textSecondary}>
          <text size="large" weight="bold" color={colors.textPrimary}>Baskerville (Serif)</text>
          <text size="medium" color={colors.textPrimary} wrap={true}>
            Observe the open, unclosed tail on the lowercase g.
          </text>
        </vstack>

        <spacer size="large" />
        <button appearance="secondary" onPress={() => setPage('landing')}>Back to Menu</button>
      </vstack>
    );

    const GameWebview = () => (
      <vstack height="100%" width="100%">
        {/* The webview block that loads your index.html and game.js */}
        <webview
          id="fontWarsWebView"
          url="index.html"
          onMessage={(msg) => {
            // Listen for the GAME_OVER message emitted by game.js
            if (msg.type === 'GAME_OVER') {
              if (msg.payload.topScore > topScore) {
                setTopScore(msg.payload.topScore);
              }
              // Show a native Reddit toast notification with the results
              context.ui.showToast({ text: `Game Over! Score: ${msg.payload.score} in ${msg.payload.time}` });
              // Route the user back to the landing menu
              setPage('landing');
            }
          }}
          state={{
