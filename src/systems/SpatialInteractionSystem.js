import { System, Raycaster, Vector3 } from '@iwsdk/core';

export class SpatialInteractionSystem extends System {
  initialize() {
    this.raycaster = new Raycaster();
    this.activeButtons = [];
  }

  registerButton(spatialButton) {
    this.activeButtons.push(spatialButton);
  }

  clearButtons() {
    this.activeButtons.forEach(btn => btn.destroy());
    this.activeButtons = [];
  }

  update(dt) {
    // Acquire active XR inputs (hand pinch or controller trigger)
    const inputs = this.query.world.getXRInputs();

    inputs.forEach(input => {
      if (!input.ray) return;

      this.raycaster.set(input.ray.origin, input.ray.direction);

      this.activeButtons.forEach(button => {
        const intersects = this.raycaster.intersectObject(button.mesh);

        if (intersects.length > 0) {
          button.setHover(true);

          // Process pinch gesture or primary trigger press
          if (input.isPinching || input.isTriggerPressed) {
            button.triggerPinch();
          }
        } else {
          button.setHover(false);
        }
      });
    });
  }
}
