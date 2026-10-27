# Font Wars

Font Wars is a spatial typography training game built with Vite, Three.js and Meta's Immersive Web SDK (IWSDK). The experience is designed for Meta Quest and WebXR-compatible headsets. The application UI is rendered as 3D meshes; it does not create HTML buttons, forms, or HUD overlays. The browser DOM is limited to the renderer container and offscreen canvases used to texture 3D lettering.

## Features implemented

- 3D landing, font library, settings, gameplay, and game-over views.
- 10-round Serif vs. Sans-Serif classification sessions.
- A mandatory 2.5-second anatomy-feedback pause after each answer.
- A paginated, 400-entry library split into 200 Serif and 200 Sans-Serif entries.
- Runtime loading of `/data/fonts.json` and `/data/words.json`.
- IWSDK `RayInteractable` surfaces, with the custom `SpatialInteractionSystem` reacting to ECS `Hovered` and `Pressed` states for controller rays and hand-pinches.
- Sound and haptic toggles, Easy / Standard / Expert difficulty settings, score, accuracy, and the five highest scores saved in browser storage.
- Vercel static deployment configuration.

## Requirements

- Node.js `22.12+` (Node 22 is recommended for the current IWSDK toolchain).
- npm.
- For the immersive experience: Meta Quest or another WebXR-compatible headset and an HTTPS origin. A headset is optional for initial development because the IWSDK dev environment includes XR emulation.

## Run locally

```bash
npm install
npm run dev
```

The IWSDK-managed dev command launches Vite with HTTPS and XR emulation. Use the runtime URL reported by the dev command. On desktop, use the IWSDK Enter XR / emulator controls and select with the emulated controller trigger. In a Quest browser, open the HTTPS network URL from a device on the same network and enter XR.

For a plain Vite runtime without the managed emulator, use:

```bash
npm run dev:runtime
```

## Build and deploy

```bash
npm run build
npm run preview
```

Vercel uses `npm run build` and the `dist` output directory through `vercel.json`. The JSON datasets stay under `public/data/`, so Vite copies them as runtime-addressable static assets. Dataset loading is base-path aware for deployments under a subpath.

## Data validation

`public/data/fonts.json` contains exactly 400 entries, split evenly across `Serif` and `Sans-Serif`. `public/data/words.json` contains 861 vocabulary items. Validate the committed datasets with:

```bash
npm run data:validate
```

Regenerate both datasets with:

```bash
npm run data:generate
```

## Typography specimen loading

The game attempts to load each selected family from Google Fonts at runtime and redraws the specimen when the font is ready. If a family is unavailable or the headset is offline, the specimen uses a category-appropriate system fallback so the round remains playable. This external font load is only for rendering specimen lettering; it is not required for the game data or score tracking.

## Controls and gameplay

All app actions are 3D spatial surfaces and use the IWSDK input pipeline. No app-level mouse-click or touch listeners are registered. On a physical headset, aim with an XR controller and select with its trigger, or use supported hand tracking and pinch. Every session contains 10 rounds. The game reveals the classification and anatomical tip after the player answers, keeps the feedback visible for 2.5 seconds, and then advances automatically.

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
├── scripts/generate-data.py
└── src/
    ├── FontGameSystem.js
    ├── SpatialInteractionSystem.js
    ├── SpatialViewStateManager.js
    └── index.js
```

## SDK references

- [IWSDK overview](https://iwsdk.dev/guides/overview.html)
- [Project manifest](https://iwsdk.dev/guides/01a-project-manifest.html)
- [Built-in interactions](https://iwsdk.dev/guides/06-built-in-interactions.html)
- [Custom ECS systems](https://iwsdk.dev/guides/07-custom-systems.html)
