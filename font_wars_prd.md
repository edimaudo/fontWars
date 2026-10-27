# Product Requirement Document (PRD)
## Project Name: Font Wars (`fontWars`)
**Platform:** WebXR / Meta Quest (Immersive Web SDK)  
**Version:** 1.0.0  
**Architecture:** ECS (Entity Component System), Three.js, Vite  

---

## 1. Executive Summary & Core Philosophy

**Font Wars** is a native 3D WebXR typographic training and battle game designed specifically for Meta Quest and modern WebXR-compliant headsets. It challenges users to recognize, analyze, and differentiate between 400 professional typefaces in high-stakes spatial rounds.

### Key Architectural Principles
* **Zero 2D DOM Dependencies:** Strict ban on traditional HTML/CSS DOM buttons, forms, or overlay UI elements. The entire experience—including menus, gameplay, settings, and HUD—is rendered as volumetric 3D spatial entities within Three.js / IWSDK.
* **Hands-First Spatial Interactions:** All user input is driven by hand-tracking pinch gestures and WebXR controller raycasting via `SpatialInteractionSystem`. Standard mouse `click` or touch events are forbidden.
* **Non-Truncated Dynamic Assets:** Datasets (`words.json` and `fonts.json`) are fetched asynchronously at runtime from the public directory (`/data/`) to prevent AI truncation or data loss during deployment.

---

## 2. Tech Stack & Dependencies

| Layer | Specification |
| :--- | :--- |
| **Framework** | Meta Immersive Web SDK (`@iwsdk/core`) |
| **3D Rendering Engine** | Three.js (`npm:super-three@0.181.0`) |
| **Build Tooling** | Vite |
| **Deployment Platform** | Vercel / GitHub Pages |
| **Input Specifications** | WebXR Controllers + Direct Hand-Tracking (Pinch Pose) |

---

## 3. Core Systems Architecture

```
                                +---------------------------+
                                |      WebXR World Core     |
                                +-------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
       +-------------v-------------+                     +-------------v-------------+
       |   SpatialInteractionSystem |                     |   SpatialViewStateManager |
       +-------------+-------------+                     +-------------+-------------+
                     |                                                 |
                     | Raycast / Pinch                                 | Active View State
                     v                                                 v
       +-------------+-------------+                     +-------------+-------------+
       |       SpatialButton       |                     |     LANDING / LIBRARY /    |
       +---------------------------+                     |    SETTINGS / GAME_LOOP    |
                                                         +-------------+-------------+
                                                                       |
                                                                       v
                                                         +-------------+-------------+
                                                         |      FontGameSystem       |
                                                         +-------------+-------------+
                                                                       |
                                                                       v
                                                         +-------------+-------------+
                                                         | Runtime Asset Fetcher     |
                                                         | (/data/words.json,        |
                                                         |  /data/fonts.json)        |
                                                         +---------------------------+
```

### 3.1 `SpatialViewStateManager` (State Machine)
Manages spatial transitions across five primary views:
1. `LANDING`: Title display, play trigger, library router, settings access.
2. `LIBRARY`: 3D paginated catalog displaying the 400 font database with anatomical tips.
3. `SETTINGS`: Spatial toggles for sound, haptics, and difficulty modes.
4. `GAME_LOOP`: Active gameplay rounds with target words and choice choices.
5. `GAME_OVER`: 3D modal displaying score summary, accuracy, and local persistent high scores.

### 3.2 `FontGameSystem` (Game Engine)
* Loads `words.json` and `fonts.json` asynchronously during initialization.
* Controls session rounds (10 rounds per game session).
* Evaluates user choices against typeface classifications (Serif vs. Sans-Serif).
* Manages a mandatory 2.5-second learning pause upon selection to display anatomical feedback tooltips.

### 3.3 `SpatialInteractionSystem`
* Emits rays from XR controllers or hand pinch joints.
* Executes hit tests against active `SpatialButton` spatial bounding boxes.
* Updates hover material states (Default, Hover, Selected) and dispatches action callbacks.

---

## 4. Dataset & Data Structures

### 4.1 Fonts Database (`/public/data/fonts.json`)
Consists of exactly **400 typefaces** evenly split (200 Serif, 200 Sans-Serif).

```json
{
  "fonts": [
    {
      "id": "serif_1",
      "name": "Garamond",
      "category": "Serif",
      "anatomicalTip": "Features structured terminal serifs, high stroke contrast, and a diagonal stress axis."
    },
    {
      "id": "sans_1",
      "name": "Helvetica",
      "category": "Sans-Serif",
      "anatomicalTip": "Clean unadorned stroke terminals, uniform weight, and horizontal cut counters."
    }
  ]
}
```

### 4.2 Word Inventory (`/public/data/words.json`)
Provides an expansive array of testing vocabulary consumed dynamically during round instantiation:

```json
{
  "words": [
    "aardvark", "abacus", "abandon", "abate", "abbey", "abdomen",
    "abstract", "acceleration", "aesthetic", "algorithm", "alphabet"
  ]
}
```

---

## 5. UI/UX & Spatial Design Requirements

1. **Volumetric UI Panels:** UI surfaces must be rendered as 3D boxes/planes with depth (`BoxGeometry`) floating at a comfortable distance (`z: -2.0m` to `-2.5m`) in front of the camera.
2. **Interactive Elements:** Spatial buttons must provide clear visual states:
   * **Default:** Dark Blue/Slate (`#3B82F6` / `#1E1E2E`)
   * **Hover:** Bright Cyan/Blue (`#60A5FA`)
   * **Selected/Correct:** Emerald Green (`#10B981`)
   * **Incorrect:** Crimson Red (`#EF4444`)
3. **Anatomical Tip Overlay:** Appears above the target mesh during the 2.5-second feedback window to reinforce spatial typographic learning.

---

## 6. Development & Deployment Guidelines

### Local Development Setup
```bash
# 1. Install dependencies with Three.js override
npm install

# 2. Start Vite WebXR emulation server
npm run dev
```

### Build & Deployment
* **Vercel Pipeline:** Auto-builds from `main` branch via `npm run build`.
* **Public Assets:** `words.json` and `fonts.json` MUST be located in `/public/data/` to ensure uncompressed, untruncated runtime serving.