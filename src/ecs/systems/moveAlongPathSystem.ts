import { Scalar } from '../../libs/babylon/exports';
import type { ISystemFactory } from '../world';

export const MoveAlongPathSystem: ISystemFactory = world => {
  const query = world.with('transform', 'pathfinding', 'movement');

  return {
    update: (deltaTime: number) => {
      for (const { pathfinding, transform, movement } of query) {
        const speed = 4;
        let deltaSpeed = speed * deltaTime;

        if (
          !pathfinding.path ||
          pathfinding.path.length === 0 ||
          !pathfinding.calculated
        ) {
          movement.velocity.x = 0;
          movement.velocity.y = 0;

          continue;
        }

        while (deltaSpeed > 0 && pathfinding.path.length > 0) {
          let nextPoint = pathfinding.path[0];
          let dx = nextPoint.x - transform.pos.x;
          let dy = nextPoint.y - transform.pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const deltaDistance = Math.min(deltaSpeed, distance);
          deltaSpeed -= deltaDistance;

          if (deltaDistance === distance) {
            pathfinding.path.shift();

            if (pathfinding.path.length === 0) {
              movement.velocity.x = 0;
              movement.velocity.y = 0;

              break;
            }

            if (distance < 0.00001) continue;
          }

          movement.velocity.x = (dx / distance) * speed;
          movement.velocity.y = (dy / distance) * speed;

          const deltaX = (dx / distance) * deltaDistance;
          const deltaY = (dy / distance) * deltaDistance;

          transform.pos.x += deltaX;
          transform.pos.y += deltaY;

          if (world.terrain) {
            const h = world.getTerrainHeight(transform.pos.x, transform.pos.y);
            transform.pos.z = Scalar.Lerp(transform.pos.z, h, 5 * deltaTime);
          }

          transform.rot.z =
            Math.atan2(movement.velocity.y, movement.velocity.x) + Math.PI / 2;
        }
      }
    },
  };
};
