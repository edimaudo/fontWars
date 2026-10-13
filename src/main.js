import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { FontGameSystem } from './systems/FontGameSystem.js';

// Initialize the IWSDK ECS World bound to the scene container
World.create(
  document.getElementById('scene-container'),
  projectOptions
).then((world) => {
  console.log("Font Wars spatial environment initialized.");
  // Register our custom game loop system for handling font rounds and hand tracking
  world.registerSystem(FontGameSystem);
});
