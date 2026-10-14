import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { FontGameSystem } from './systems/FontGameSystem.js';
import { SpatialInteractionSystem } from './systems/SpatialInteractionSystem.js';

World.create(
  document.getElementById('scene-container'),
  projectOptions
).then((world) => {
  console.log("Font Wars spatial environment fully initialized.");
  
  // Register ECS systems in execution order
  world.registerSystem(SpatialInteractionSystem);
  world.registerSystem(FontGameSystem);
}).catch((error) => {
  console.error("Failed to initialize IWSDK World:", error);
});
