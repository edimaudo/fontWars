import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { FontGameSystem } from './systems/FontGameSystem.js';

// Initialize the IWSDK ECS World bound to the WebXR scene container
World.create(
  document.getElementById('scene-container'),
  projectOptions
).then((world) => {
  console.log("Font Wars spatial environment initialized.");
  // Register our core spatial typography game system
  world.registerSystem(FontGameSystem);
}).catch((error) => {
  console.error("Failed to initialize IWSDK World:", error);
});
