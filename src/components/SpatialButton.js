import { Mesh, BoxGeometry, MeshStandardMaterial, Vector3 } from '@iwsdk/core';

export class SpatialButton {
  constructor(world, text, position, onClickCallback) {
    this.world = world;
    this.onClick = onClickCallback;
    this.isHovered = false;

    // 3D Geometry and Surface Material
    this.geometry = new BoxGeometry(0.8, 0.25, 0.05);
    this.defaultMaterial = new MeshStandardMaterial({ color: 0x3B82F6, roughness: 0.3 });
    this.hoverMaterial = new MeshStandardMaterial({ color: 0x60A5FA, roughness: 0.1 });
    this.selectedMaterial = new MeshStandardMaterial({ color: 0x10B981, roughness: 0.1 });

    this.mesh = new Mesh(this.geometry, this.defaultMaterial);
    this.mesh.position.copy(position);
    
    // Attach spatial entity transform to world
    this.entity = this.world.createTransformEntity(this.mesh);
    this.textValue = text;
  }

  setHover(state) {
    if (this.isHovered !== state) {
      this.isHovered = state;
      this.mesh.material = state ? this.hoverMaterial : this.defaultMaterial;
    }
  }

  triggerPinch() {
    this.mesh.material = this.selectedMaterial;
    if (this.onClick) {
      this.onClick(this.textValue);
    }
  }

  destroy() {
    if (this.entity) {
      this.world.destroyEntity(this.entity);
    }
  }
}
