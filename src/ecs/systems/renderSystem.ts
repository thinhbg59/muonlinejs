import { Vector3 } from '../../libs/babylon/exports';
import { ISystemFactory } from '../world';

const v3Temp = Vector3.Zero();

export const RenderSystem: ISystemFactory = world => {
  const query = world.with('transform', 'modelObject');

  return {
    update: () => {
      for (const { transform, modelObject } of query) {
        modelObject.Update(world.gameTime);

        v3Temp.copyFrom(transform.rot as any);
        v3Temp.y = Math.PI * 2 - v3Temp.y;

        modelObject.updateLocation(
          transform.pos,
          transform.scale * 0.01,
          v3Temp
        );

        modelObject.Draw(world.gameTime);
      }
    },
  };
};
