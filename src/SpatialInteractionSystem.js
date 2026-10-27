import { createComponent, createSystem, Hovered, Pressed, RayInteractable, Types } from '@iwsdk/core';

const COLORS = {
  default: '#1e1e2e',
  hover: '#60a5fa',
  selected: '#10b981',
  incorrect: '#ef4444',
  disabled: '#273044',
};

export const SpatialButton = createComponent('SpatialButton', {
  id: { type: Types.String, default: '' },
});

/**
 * SpatialInteractionSystem
 *
 * Interactive surfaces are 3D Object3Ds with RayInteractable + SpatialButton.
 * IWSDK feeds controller rays and hand-pinches into Hovered / Pressed ECS tags.
 * No application DOM click or touch handlers are used.
 */
export class SpatialInteractionSystem extends createSystem({
  buttons: { required: [RayInteractable, SpatialButton] },
  hovered: { required: [RayInteractable, SpatialButton, Hovered] },
  pressed: { required: [RayInteractable, SpatialButton, Pressed] },
}) {
  init() {
    this.pressedLastFrame = new Set();
  }

  update() {
    const hovered = this.queries.hovered.entities;
    const pressed = this.queries.pressed.entities;
    const currentlyPressed = new Set(pressed);

    for (const entity of this.queries.buttons.entities) {
      const root = entity.object3D;
      const button = root?.userData?.spatialButton;
      if (!button) continue;

      const isHovered = hovered.has(entity);
      const isPressed = pressed.has(entity);
      const isNewPress = isPressed && !this.pressedLastFrame.has(entity);
      const nextState = button.lockedColor
        ? button.lockedColor
        : button.disabled
          ? 'disabled'
          : isPressed
            ? 'selected'
            : isHovered
              ? 'hover'
              : 'default';

      if (button.visualState !== nextState) {
        button.visualState = nextState;
        const color = COLORS[nextState] || COLORS.default;
        for (const material of button.bodyMaterials) {
          material.color.set(color);
          material.emissive?.set(nextState === 'hover' ? '#0b223b' : '#000000');
        }
      }

      if (isNewPress && !button.disabled && typeof button.activate === 'function') button.activate();
    }

    this.pressedLastFrame = currentlyPressed;
  }
}

export { COLORS as SpatialButtonColors };
