# Font Wars

Font Wars is a spatial typography training game built with Vite, Three.js and Meta's Immersive Web SDK (IWSDK). It targets Meta Quest and compatible WebXR headsets. Application controls, learning content and gameplay are rendered as 3D scene objects. The DOM is limited to the renderer container and offscreen canvases used to create text textures.

## Implemented

### Game modes

- **Classification:** Ten rounds. The player identifies each typeface as Serif or Sans-Serif. Each session contains five of each category, with no repeated typeface.
- **Typeface Duel:** Ten rounds. The player is shown a target family name and two specimens of the same word rendered in different typefaces, then selects A or B. The two candidate faces are paired from the same Serif/Sans-Serif category and challenge tier to avoid giving away the answer through category alone. No typeface repeats within a session.
- Both modes verify font loading before play, lock the answer after selection, show the correct answer and an anatomy observation, then advance after a mandatory 2.5-second learning pause.
- Easy uses Tier 1 typefaces and shorter specimens. Standard uses all tiers and varied words. Expert uses Tier 3 typefaces and mixed glyph specimens.
- Correct-answer scoring is 75 / 100 / 150 points for Easy / Standard / Expert.
- Scores are stored locally. The top five are kept separately by game mode and difficulty so scores from different scoring contexts are not mixed.
- Players can exit to the main menu while a session is running or font verification is in progress.

### Typeface catalogue and rendering

- 400 catalogue records, split evenly into 200 Serif and 200 Sans-Serif families.
- Font family names and source pages are recorded in `public/data/fonts.json`.
- Each record has a unique anatomical observation prompt. These are visual inspection exercises, not expert-verified statements of exclusive characteristics for every family.
- Font loading uses the Google Fonts CSS2 API. A family is not used in a game round until the browser confirms that the requested face loaded for the specimen glyph set.
- There is no silent Georgia/Arial substitution when a requested face is unavailable. The app reports the loading failure instead.
- Family-specific font licensing is not assumed to be identical. Review the relevant family metadata and license in the upstream Google Fonts repository before redistributing font files.

### Spatial library

- Six typeface cards per page.
- All / Serif / Sans-Serif catalogue filtering.
- Cards render a specimen in the selected family's actual font after the family has loaded.
- Detail panel with family name, classification, challenge tier and anatomical observation.
- Glyph inspection presets for `AaGg`, `R Q &`, and `0123456789`.

### Spatial interaction and screens

- 3D landing, library, settings, classification / Duel gameplay and game-over views.
- Controller-ray and hand-input interaction via IWSDK `RayInteractable`, `Hovered` and `Pressed` components.
- Default, hover, selected/correct, incorrect and disabled button states.
- Sound and haptic settings.
- Vercel static deployment configuration.

## Important runtime requirements and limitations

Google Fonts are delivered at runtime and are not bundled in this repository. Internet access is required for the exact families to render. If a family cannot be loaded and verified, it is excluded from the session rather than substituted with another typeface.

The committed data validator confirms the catalogue structure (400 unique records, 200 records per category, unique IDs/names and unique observation prompts). **It does not prove that all 400 family names are currently available from Google Fonts.** Run the remote verification command before release and resolve any failed families. The observation prompts also require a typography subject-matter review before being presented as authoritative family-specific descriptions.

The full Vite production build and headset runtime have not been verified in this environment because package registry and Google Fonts network access were unavailable. Node-level game logic and dataset validation can run without installing the browser dependencies.

## Requirements

- Node.js 22.12+ (Node 22 is recommended for the current IWSDK toolchain).
- npm.
- For immersive use: Meta Quest or another WebXR-compatible headset and an HTTPS origin.
- Internet access for Google Fonts loading and remote family verification.

## Run locally

```bash
npm install
npm run dev
```

The IWSDK-managed development command launches Vite with XR emulation. Use the runtime URL reported by the development command. On desktop, use the IWSDK Enter XR / emulator controls and select with the emulated controller trigger. In a Quest browser, open the HTTPS network URL from a device on the same network and enter XR.

For a plain Vite runtime without the managed emulator, use:

```bash
npm run dev:runtime
```

## Validation and tests

Validate the committed JSON datasets:

```bash
npm run data:validate
```

Run the automated game-logic tests:

```bash
npm test
```

The tests cover both game modes, all three difficulty levels, unique font selection, paired-font constraints, scoring, answer locking, learning-pause timing, round advancement, and Duel session completion / score persistence.

Verify all 400 family names against the Google Fonts CSS2 API and check that the requested Latin specimen glyph set is returned:

```bash
npm run fonts:verify
```

This command requires internet access. It writes `public/data/font-verification.json` with verification time, counts, and per-family results. Run it before release and resolve failed entries. Browser-level loading is also verified at runtime before a typeface is included in a session.

Regenerate datasets after changing the curated names or prompts:

```bash
npm run data:generate
npm run data:validate
```

## Build and deploy

```bash
npm run build
npm run preview
```

Vercel uses `npm run build` and the `dist` output directory through `vercel.json`. The JSON datasets remain in `public/data/` and are served as runtime assets.

## Project layout

```text
fontWars/
├── iwsdk.config.json
├── package.json
├── vercel.json
├── vite.config.js
├── public/
│   ├── data/
│   │   ├── fonts.json
│   │   └── words.json
│   └── scenes/main.iwsdk.scene.json
├── scripts/
│   ├── generate-data.py
│   ├── validate-data.py
│   └── verify-fonts.mjs
├── src/
│   ├── FontGameSystem.js
│   ├── SpatialInteractionSystem.js
│   ├── SpatialViewStateManager.js
│   └── index.js
└── tests/
    └── FontGameSystem.test.js
```

## SDK references

- [IWSDK overview](https://iwsdk.dev/guides/overview.html)
- [Project manifest](https://iwsdk.dev/guides/01a-project-manifest.html)
- [Built-in interactions](https://iwsdk.dev/guides/06-built-in-interactions.html)
- [Custom ECS systems](https://iwsdk.dev/guides/07-custom-systems.html)
