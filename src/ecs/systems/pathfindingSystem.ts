import { CreateBox, Matrix } from '@babylonjs/core';
import { createPathfinding } from '../../libs/pathfinding';
import { ISystemFactory } from '../world';

export const PathfindingSystem: ISystemFactory = world => {
  const query = world.with('pathfinding');

  const pathfinder = createPathfinding({
    width: 256,
    height: 256,
  });

  let init = false;

  const box = CreateBox('__pathfinding__', { size: 0.95 }, world.scene);
  box.setParent(world.mapParent);

  return {
    update: () => {
      if (!world.terrain) {
        init = false;
        return;
      }

      // if (!init) {
      //   init = true;

      //   const ids: number[] = [];

      //   for (let x = 0; x < 256; x++) {
      //     for (let y = 0; y < 256; y++) {
      //       const isWalkable = world.isWalkable(x, y);

      //       if (!isWalkable) {
      //         ids.push(x + y * 256);

      //         box.thinInstanceAdd(Matrix.Translation(x, y, 1.5), false);
      //       }
      //     }
      //   }

      //   pathfinder.applyClosedPatch(ids);

      //   box!.thinInstanceBufferUpdated('matrix');
      // }

      for (const { pathfinding } of query) {
        if (pathfinding.calculated) continue;

        pathfinding.path = pathfinder.search(pathfinding.from, pathfinding.to);

        pathfinding.calculated = true;
        // console.log([...pathfinding.path]);
      }
    },
  };
};
