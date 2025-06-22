import { ISystemFactory } from '../world';

const v3Temp = { x: 0, y: 0, z: 0 };

export const RenderSystem: ISystemFactory = world => {
  const query = world.with('transform', 'modelObject');

  return {
    update: () => {
      const terrainScale = world.terrainScale;
      for (const { transform, modelObject } of query) {
        modelObject.Update(world.gameTime);

        v3Temp.x = transform.pos.x * terrainScale;
        v3Temp.y = transform.pos.y * terrainScale;
        v3Temp.z = transform.pos.z * terrainScale;

        modelObject.updateLocation(v3Temp, transform.scale, transform.rot);

        modelObject.Draw(world.gameTime);
      }
    },
  };
};
