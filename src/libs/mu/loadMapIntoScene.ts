import { ENUM_WORLD } from '../../common';
import type { World } from '../../ecs/world';
import { spawnPlayer } from '../../logic';
import { Store } from '../../store';
import { createLorencia } from '../../maps/lorencia';
import { getTerrainData } from './getTerrainData';
import { Vector3 } from '../babylon/exports';
import { toRadians } from '../../common/utils';
import {
  ItemGroups,
  MODEL_HOUSE_WALL05,
  MODEL_HOUSE_WALL06,
} from '../../common/objects/enum';
import { MapTileObject } from '../../common/mapTileObject';
import { IVector3Like } from '../babylon/exports';
import { ItemsDatabase } from '../../common/itemsDatabase';
import { EventBus } from '../eventBus';
import { DISABLE_OBJECTS_LOADING } from '../../consts';
import { PoseBoxObject } from '../../maps/lorencia/poseBoxObject';
import { SoundsManager } from '../soundsManager';

async function loadWorld(world: World) {
  if (!world.terrain) return;

  const tiles = world.terrain.MapTileObjects;
  const map = world.terrain.index;

  switch (map) {
    case ENUM_WORLD.WD_0LORENCIA:
      world.add({
        worldIndex: map,
        interactiveArea: {
          min: { x: 120, y: 120 },
          max: { x: 129, y: 136 },
          onEnter: () => {
            SoundsManager.stopAllMusic();
            SoundsManager.loadAndPlaySoundEffect('Music/Pub');

            const models = [MODEL_HOUSE_WALL05, MODEL_HOUSE_WALL06];
            const query = world.with('transform', 'modelId', 'worldIndex');
            models.forEach(id => {
              for (const e of query) {
                if (e.worldIndex !== map) continue;
                if (e.modelId === id) {
                  e.transform.posOffset = { x: 0, y: 100, z: 0 };
                }
              }
            });
          },
          onLeave: () => {
            SoundsManager.stopAllMusic();
            SoundsManager.loadAndPlaySoundEffect('Music/main_theme');

            const models = [MODEL_HOUSE_WALL05, MODEL_HOUSE_WALL06];
            const query = world.with('transform', 'modelId', 'worldIndex');
            models.forEach(id => {
              for (const e of query) {
                if (e.worldIndex !== map) continue;
                if (e.modelId === id) {
                  e.transform.posOffset = undefined;
                }
              }
            });
          },
        },
        onDispose: () => {
          SoundsManager.stopSoundEffect('Music/Pub');
        },
      });
      return createLorencia(world);
    case ENUM_WORLD.WD_2DEVIAS:
      tiles[91] = PoseBoxObject;
      return;
    case ENUM_WORLD.WD_3NORIA:
      tiles[38] = PoseBoxObject;
      return;
    case ENUM_WORLD.WD_7ATLANSE:
      tiles[39] = PoseBoxObject;
      return;
  }
}

function createObjects(
  world: World,
  objs: { id: number; pos: IVector3Like; rot: IVector3Like; scale: number }[]
) {
  for (const data of objs) {
    const angles = new Vector3(
      toRadians(data.rot.x),
      toRadians(data.rot.z),
      toRadians(data.rot.y)
    );

    const pos = new Vector3(
      data.pos.x / world.terrainScale,
      data.pos.z / world.terrainScale,
      data.pos.y / world.terrainScale
    );

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

async function unloadMap(world: World) {
  if (!world.terrain) return;

  const oldMap = world.terrain.index;

  const query = world.with('worldIndex');

  for (const e of query) {
    if (e === world.playerEntity) continue;
    if (e.worldIndex === oldMap) {
      world.remove(e);
      e.onDispose?.();
      e.modelObject?.dispose();
    }
  }

  world.terrain.mesh.material?.dispose(true, true);
  world.terrain.mesh.dispose(false, true);
}

export async function loadMapIntoScene(world: World, map: ENUM_WORLD) {
  const oldMap = world.terrain?.index;
  if (oldMap !== map) {
    await unloadMap(world);

    const {
      objects,
      terrain,
      RequestTerrainHeight,
      IsWalkable,
      RequestTerrainFlag,
      GetTerrainTile,
    } = await getTerrainData(world, map);

    world.getTerrainHeight = RequestTerrainHeight;
    world.isWalkable = IsWalkable;
    world.getTerrainFlag = RequestTerrainFlag;
    world.getTerrainTile = GetTerrainTile;

    world.terrain = {
      mesh: terrain,
      index: map,
      MapTileObjects: new Array(256).fill(MapTileObject),
    };

    await loadWorld(world);

    const filteredObjects = objects; //filter(o => TYPES.includes(o.id));

    !DISABLE_OBJECTS_LOADING && createObjects(world, filteredObjects);
  }

  if (Store.isOffline && !world.playerEntity) {
    const testPlayer = spawnPlayer(world);
    testPlayer.transform.pos.x = 135;
    testPlayer.transform.pos.y = 1.7;
    testPlayer.transform.pos.z = 131;
    world.addComponent(testPlayer, 'localPlayer', true);
    world.addComponent(testPlayer, 'worldIndex', map);

    testPlayer.objectNameInWorld = 'TestPlayer';

    const DragonSetIndex = 1;

    testPlayer.charAppearance.helm = {
      num: DragonSetIndex,
      group: ItemGroups.Helm,
      lvl: 9,
      isExcellent: false,
    };

    testPlayer.charAppearance.armor = {
      num: DragonSetIndex,
      group: ItemGroups.Armor,
      lvl: 7,
      isExcellent: false,
    };

    testPlayer.charAppearance.pants = {
      num: DragonSetIndex,
      group: ItemGroups.Pants,
      lvl: 9,
      isExcellent: false,
    };

    testPlayer.charAppearance.gloves = {
      num: DragonSetIndex,
      group: ItemGroups.Gloves,
      lvl: 5,
      isExcellent: false,
    };

    testPlayer.charAppearance.boots = {
      num: DragonSetIndex,
      group: ItemGroups.Boots,
      lvl: 1,
      isExcellent: false,
    };

    const weapon = ItemsDatabase.getItem(3, 9); // bill spear
    // const weapon = ItemsDatabase.getItem(1, 1); // small axe
    testPlayer.charAppearance.leftHand = {
      num: weapon.ItemSubIndex,
      group: weapon.ItemSubGroup,
      lvl: 9,
      isExcellent: false,
    };
  }

  if (world.playerEntity) {
    world.playerEntity.worldIndex = map;
    const pos = world.playerEntity.transform.pos;

    switch (map) {
      case ENUM_WORLD.WD_0LORENCIA:
        pos.x = 135;
        pos.z = 131;
        break;
      case ENUM_WORLD.WD_1DUNGEON:
        pos.x = 232;
        pos.z = 126;
        break;
      case ENUM_WORLD.WD_3NORIA:
        pos.x = 174;
        pos.z = 123;
        break;
      case ENUM_WORLD.WD_4LOSTTOWER:
        pos.x = 208;
        pos.z = 81;
        break;
      case ENUM_WORLD.WD_6STADIUM:
        pos.x = 56;
        pos.z = 85;
        break;
      case ENUM_WORLD.WD_7ATLANSE:
        pos.x = 20;
        pos.z = 20;
        break;
      case ENUM_WORLD.WD_8TARKAN:
        pos.x = 200;
        pos.z = 58;
        break;
      case ENUM_WORLD.WD_10ICARUS:
        pos.x = 14;
        pos.z = 12;
        break;
      case ENUM_WORLD.WD_33AIDA:
        pos.x = 85;
        pos.z = 10;
        break;
      case ENUM_WORLD.WD_51ELBELAND:
        pos.x = 61;
        pos.z = 201;
        break;
      case ENUM_WORLD.WD_2DEVIAS:
        pos.x = 219;
        pos.z = 24;
        break;
    }

    pos.y = world.getTerrainHeight(pos.x, pos.z);
  }

  EventBus.emit('warpCompleted', { map });
}
