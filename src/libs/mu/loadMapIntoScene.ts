import { ENUM_WORLD } from '../../../common';
import type { World } from '../../ecs/world';
import { spawnPlayer } from '../../logic';
import { Store } from '../../store';
import { createLorencia } from '../../maps/lorencia';
import { getTerrainData } from './getTerrainData';
import { Vector3 } from '../babylon/exports';
import { toRadians } from '../../../common/utils';
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
import { MapTileObject } from '../../../common/mapTileObject';
import { IVector3Like } from '@babylonjs/core/Maths/math.like';

async function loadWorld(world: World) {
  if (!world.terrain) return;

  switch (world.terrain.index) {
    case ENUM_WORLD.WD_0LORENCIA:
      return createLorencia(world);
  }
}

function createObjects(
  world: World,
  objs: { id: number; pos: IVector3Like; rot: IVector3Like; scale: number }[]
) {
  for (const data of objs) {
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
      worldIndex: world.terrain!.index,
      transform: {
        pos,
        rot: angles,
        scale: data.scale,
      },
      modelId: data.id,
      modelFactory: world.terrain!.MapTileObjects[data.id] || MapTileObject,
      visibility: {
        state: 'hidden',
        lastChecked: 0,
      },
    });
  }
}

export async function loadMapIntoScene(world: World, map: ENUM_WORLD) {
  const scene = world.scene;
  const {
    objects,
    terrain,
    RequestTerrainHeight,
    IsWalkable,
    RequestTerrainFlag,
  } = await getTerrainData(scene, ENUM_WORLD.WD_0LORENCIA);

  world.getTerrainHeight = RequestTerrainHeight;
  world.isWalkable = IsWalkable;
  world.getTerrainFlag = RequestTerrainFlag;

  world.terrain = {
    mesh: terrain,
    index: map,
    MapTileObjects: new Array(256).fill(MapTileObject),
  };

  await loadWorld(world);

  const filteredObjects = objects; //filter(o => TYPES.includes(o.id));

  createObjects(world, filteredObjects);

  if (Store.isOffline) {
    const testPlayer = spawnPlayer(world);
    testPlayer.transform.pos.x = 135;
    testPlayer.transform.pos.y = 131;
    testPlayer.transform.pos.z = 1.7;
    world.addComponent(testPlayer, 'localPlayer', true);
    world.addComponent(testPlayer, 'worldIndex', map);

    testPlayer.objectNameInWorld = 'TestPlayer';
  }
}
