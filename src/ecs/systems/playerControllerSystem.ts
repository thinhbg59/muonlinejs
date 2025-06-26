import { CreateBox } from '../../libs/babylon/exports';
import { EventBus } from '../../libs/eventBus';
import type { ISystemFactory } from '../world';

export const PlayerControllerSystem: ISystemFactory = world => {
  const query = world.with('playerMoveTo', 'transform', 'pathfinding');

  const size = 0.75;
  const box = CreateBox(
    'playerControllerBox',
    { width: size, depth: size, height: 0.02 },
    world.scene
  );
  box.setParent(world.mapParent);
  box.isPickable = false;
  box.alwaysSelectAsActiveMesh = true;

  EventBus.on('groundPointClicked', ({ point }) => {
    const playerEntity = world.playerEntity;
    if (!playerEntity) return;

    const x = Math.round(point.x);
    const z = Math.round(point.z);

    // TODO replace with world.isWalkable after fixing it
    const node = world.pathfinder.getNode(x, z);

    if (!node || node.weight < 1) return;

    // console.log(JSON.stringify(point), x, y);

    playerEntity.playerMoveTo.point.x = x;
    playerEntity.playerMoveTo.point.y = z;
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
        pathfinding.from.y = transform.pos.z;

        pathfinding.to.x = playerMoveTo.point.x;
        pathfinding.to.y = playerMoveTo.point.y;

        if (localPlayer) {
          box.position.x = playerMoveTo.point.x;
          box.position.z = playerMoveTo.point.y;
          box.position.y =
            world.getTerrainHeight(playerMoveTo.point.x, playerMoveTo.point.y) +
            0.02;
        }
      }
    },
  };
};
