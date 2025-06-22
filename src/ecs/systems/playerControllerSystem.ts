import { CreateBox } from '../../libs/babylon/exports';
import { EventBus } from '../../libs/eventBus';
import type { ISystemFactory } from '../world';

export const PlayerControllerSystem: ISystemFactory = world => {
  const query = world.with('playerMoveTo', 'transform', 'pathfinding');

  const box = CreateBox(
    'playerControllerBox',
    { width: 1, depth: 0.1, height: 1 },
    world.scene
  );
  box.setParent(world.mapParent);
  box.isPickable = false;

  EventBus.on('groundPointClicked', ({ point }) => {
    const playerEntity = world.playerEntity;
    if (!playerEntity) return;

    const x = Math.round(point.x);
    const y = Math.round(point.y);

    // TODO replace with world.isWalkable after fixing it
    const node = world.pathfinder.getNode(x, y);

    if (!node || node.weight < 1) return;

    // console.log(JSON.stringify(point), x, y);

    playerEntity.playerMoveTo.point.x = x;
    playerEntity.playerMoveTo.point.y = y;
    playerEntity.playerMoveTo.handled = false;
    playerEntity.playerMoveTo.sendToServer = true;
  });

  return {
    update: () => {
      for (const {
        playerMoveTo,
        transform,
        pathfinding,
        localPlayer,
      } of query) {
        if (playerMoveTo.handled) continue;

        playerMoveTo.handled = true;

        pathfinding.calculated = false;

        pathfinding.from.x = transform.pos.x;
        pathfinding.from.y = transform.pos.y;

        pathfinding.to.x = playerMoveTo.point.x;
        pathfinding.to.y = playerMoveTo.point.y;

        if (localPlayer) {
          box.position.x = playerMoveTo.point.x;
          box.position.y = playerMoveTo.point.y;
          box.position.z =
            world.getTerrainHeight(playerMoveTo.point.x, playerMoveTo.point.y) +
            0.1;
          box.position.scaleInPlace(world.terrainScale);
        }
      }
    },
  };
};
