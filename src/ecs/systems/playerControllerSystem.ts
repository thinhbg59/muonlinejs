import { CreateBox } from '../../libs/babylon/exports';
import { EventBus } from '../../libs/eventBus';
import type { ISystemFactory } from '../world';

export const PlayerControllerSystem: ISystemFactory = world => {
  const query = world.with(
    'playerMoveTo',
    'transform',
    'pathfinding',
    'localPlayer'
  );

  const box = CreateBox(
    'playerControllerBox',
    { width: 1, depth: 0.1, height: 1 },
    world.scene
  );
  box.setParent(world.mapParent);

  EventBus.on('groundPointClicked', ({ point }) => {
    const playerEntity = world.playerEntity;
    if (!playerEntity) return;

    // const isWalkable = world.isWalkable(point.x, point.y);

    // if (!isWalkable) return;

    playerEntity.playerMoveTo.point.x = point.x;
    playerEntity.playerMoveTo.point.y = point.y;
    playerEntity.playerMoveTo.handled = false;
    playerEntity.playerMoveTo.sendToServer = true;
  });

  return {
    update: () => {
      for (const { playerMoveTo, transform, pathfinding } of query) {
        if (playerMoveTo.handled) continue;

        playerMoveTo.handled = true;

        pathfinding.calculated = false;

        pathfinding.from.x = transform.pos.x;
        pathfinding.from.y = transform.pos.y;

        pathfinding.to.x = playerMoveTo.point.x;
        pathfinding.to.y = playerMoveTo.point.y;

        box.position.x = playerMoveTo.point.x;
        box.position.y = playerMoveTo.point.y;
        box.position.z =
          world.getTerrainHeight(playerMoveTo.point.x, playerMoveTo.point.y) +
          0.1;
        box.position.scaleInPlace(world.terrainScale);
      }
    },
  };
};
