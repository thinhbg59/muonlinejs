import type { Scene } from '@babylonjs/core';
import { RenderSystem } from './systems/renderSystem';
import { World, type ISystemFactory } from './world';
import { PathfindingSystem } from './systems/pathfindingSystem';
import { PlayerControllerSystem } from './systems/playerControllerSystem';
import { MoveAlongPathSystem } from './systems/moveAlongPathSystem';
import { AnimationSystem } from './systems/animationSystem';
import { ModelLoaderSystem } from './systems/modelLoaderSystem';
import { CameraFollowSystem } from './systems/cameraFollowSystem';
import { NetworkSystem } from './systems/networkSystem';
import { OutOfScopeSystem } from './systems/outOfScopeSystem';
import { CalculateVisibilitySystem } from './systems/calculateVisibilitySystem';

const factories: ISystemFactory[] = [
  ModelLoaderSystem,
  PlayerControllerSystem,
  PathfindingSystem,
  CalculateVisibilitySystem,
  NetworkSystem,
  MoveAlongPathSystem,
  AnimationSystem,
  CameraFollowSystem,
  OutOfScopeSystem,
  RenderSystem,
];

export function createWorld(scene: Scene) {
  const world = new World(scene);

  const systems = factories.map(f => f(world));

  return {
    world,
    updateSystems: (dt: number) => {
      systems.forEach(system => {
        system.update?.(dt);
      });
    },
  } as const;
}
