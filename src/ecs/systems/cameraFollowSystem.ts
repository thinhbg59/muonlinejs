import type { ISystemFactory } from '../world';

const VERTICAL_OFFSET = 8;
const HORIZONTAL_OFFSET = 5;

export const CameraFollowSystem: ISystemFactory = world => {
  const scene = world.scene;

  return {
    update: dt => {
      const camera = scene.activeCamera;

      if (!camera) return;

      const playerEntity = world.playerEntity;
      if (!playerEntity) return;

      camera.position.x = playerEntity.transform.pos.x + HORIZONTAL_OFFSET;
      camera.position.z = playerEntity.transform.pos.y - HORIZONTAL_OFFSET;
      camera.position.y = playerEntity.transform.pos.z + VERTICAL_OFFSET;
    },
  };
};
