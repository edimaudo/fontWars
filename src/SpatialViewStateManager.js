export const ViewState = Object.freeze({
  LANDING: 'LANDING',
  LIBRARY: 'LIBRARY',
  SETTINGS: 'SETTINGS',
  GAME_LOOP: 'GAME_LOOP',
  GAME_OVER: 'GAME_OVER',
});

/** Owns the active 3D view and makes view transitions explicit. */
export class SpatialViewStateManager {
  constructor(scene) {
    this.scene = scene;
    this.current = null;
    this.views = new Map();
  }

  register(name, group) {
    group.name = `view:${name}`;
    group.visible = false;
    this.views.set(name, group);
    this.scene.add(group);
    return group;
  }

  transition(next) {
    if (!this.views.has(next)) {
      throw new Error(`Unknown Font Wars view: ${next}`);
    }
    for (const [name, group] of this.views) group.visible = name === next;
    this.current = next;
  }

  get(name) {
    return this.views.get(name);
  }
}
