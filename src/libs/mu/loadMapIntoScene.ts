import { ENUM_WORLD } from '../../../common';
import { Vector3 } from '../babylon/exports';
import { getTerrainData } from './getTerrainData';
import { toRadians } from '../../../common/utils';
import { ModelObject } from '../../../common/modelObject';
import type { World } from '../../ecs/world';
import { spawnPlayer } from '../../logic';
import { Store } from '../../store';
import {
  MODEL_BRIDGE,
  MODEL_WATERSPOUT,
  MODEL_WELL01,
  MODEL_WELL02,
  MODEL_STAIR,
  MODEL_HANGING,
  MODEL_WELL03,
  MODEL_WELL04,
  MODEL_HOUSE01,
  MODEL_HOUSE_WALL01,
  MODEL_HOUSE_WALL02,
  MODEL_HOUSE_WALL03,
} from '../../../common/objects/enum';

export async function loadMapIntoScene(world: World, map: ENUM_WORLD) {
  const scene = world.scene;
  const {
    objects,
    terrain,
    RequestTerrainHeight,
    IsWalkable,
    RequestTerrainFlag,
  } = await getTerrainData(scene, map);
  world.terrain = terrain;

  world.getTerrainHeight = RequestTerrainHeight;
  world.isWalkable = IsWalkable;
  world.getTerrainFlag = RequestTerrainFlag;

  // terrain.updateCoordinateHeights();
  // terrain.setParent(world.mapParent);

  // world.add({
  //   transform: {
  //     pos: new Vector3(127, 129.5, 1.7),
  //     rot: Vector3.Zero(),
  //     scale: 1,
  //   },
  //   bmd: await getModel(MODEL_MONSTER01 + 1),
  //   modelObject: new ModelObject(scene, mapParent),
  // });

  // world.add({
  //   transform: {
  //     pos: new Vector3(127, 129.5, 1.7),
  //     rot: Vector3.Zero(),
  //     scale: 1,
  //   },
  //   bmd: await getModel(ENUM_NPC_MODELS.MODEL_ELF_WIZARD),
  //   modelObject: new ModelObject(scene, mapParent),
  // });

  if (Store.isOffline) {
    const testPlayer = spawnPlayer(world);
    testPlayer.transform.pos.x = 135;
    testPlayer.transform.pos.y = 131;
    testPlayer.transform.pos.z = 1.7;
    world.addComponent(testPlayer, 'localPlayer', true);
  }

  const TYPES = [
    MODEL_BRIDGE,
    MODEL_WATERSPOUT,
    MODEL_WELL01,
    MODEL_WELL02,
    MODEL_STAIR,
    MODEL_HANGING,
    MODEL_WELL03,
    MODEL_WELL04,
    MODEL_HOUSE01,
    MODEL_HOUSE_WALL01,
    MODEL_HOUSE_WALL02,
    MODEL_HOUSE_WALL03,
  ];

  const filteredObjects = objects.filter(o => TYPES.includes(o.id));

  for (const data of filteredObjects) {
    const angles = new Vector3(
      toRadians(data.rot.x),
      toRadians(data.rot.y),
      toRadians(data.rot.z)
    );

    const pos = new Vector3(
      data.pos.x / world.terrainScale,
      data.pos.y / world.terrainScale,
      data.pos.z / world.terrainScale
    );

    pos.x -= 0.5;
    pos.y -= 0.5;

    world.add({
      transform: {
        pos,
        rot: angles,
        scale: data.scale,
      },
      modelId: data.id,
      modelFactory: ModelObject,
    });
  }
}
