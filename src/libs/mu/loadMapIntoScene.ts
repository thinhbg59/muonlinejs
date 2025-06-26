import { ENUM_WORLD } from '../../common';
import type { Entity, World } from '../../ecs/world';
import { spawnPlayer } from '../../logic';
import { Store } from '../../store';
import { createLorencia } from '../../maps/lorencia';
import { getTerrainData } from './getTerrainData';
import { Color3, Vector3 } from '../babylon/exports';
import { toRadians } from '../../common/utils';
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
  MonsterActionType,
} from '../../common/objects/enum';
import { MapTileObject } from '../../common/mapTileObject';
import { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { ItemsDatabase } from '../../common/itemsDatabase';
import { MonstersDatabase } from '../../common/monstersDatabase';
import { createAttributeSystem } from '../attributeSystem';
import { ElfSoldier } from '../../common/npcs/elfSoldier';

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
      toRadians(data.rot.z),
      toRadians(data.rot.y)
    );

    const pos = new Vector3(
      data.pos.x / world.terrainScale,
      data.pos.z / world.terrainScale,
      data.pos.y / world.terrainScale
    );

    pos.x -= 0.5;
    pos.z -= 0.5;

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
  const {
    objects,
    terrain,
    RequestTerrainHeight,
    IsWalkable,
    RequestTerrainFlag,
  } = await getTerrainData(world, ENUM_WORLD.WD_0LORENCIA);

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
    testPlayer.transform.pos.y = 1.7;
    testPlayer.transform.pos.z = 131;
    world.addComponent(testPlayer, 'localPlayer', true);
    world.addComponent(testPlayer, 'worldIndex', map);

    testPlayer.objectNameInWorld = 'TestPlayer';

    const leatherArmor = ItemsDatabase.getItem(8, 5);
    testPlayer.charAppearance.armor = {
      num: leatherArmor.ItemSubIndex,
      group: leatherArmor.ItemSubGroup,
      lvl: 0,
    };

    const dragonGloves = ItemsDatabase.getItem(10, 1);
    testPlayer.charAppearance.gloves = {
      num: dragonGloves.ItemSubIndex,
      group: dragonGloves.ItemSubGroup,
      lvl: 0,
    };

    const weapon = ItemsDatabase.getItem(3, 9); // bill spear
    // const weapon = ItemsDatabase.getItem(1, 1); // small axe
    testPlayer.charAppearance.leftHand = {
      num: weapon.ItemSubIndex,
      group: weapon.ItemSubGroup,
      lvl: 0,
    };

    //
    // Test NPC
    //

    const modelFactory = ElfSoldier;

    const npcEntity = world.add({
      // netId: id,
      worldIndex: testPlayer.worldIndex,
      // npcType: npc.TypeNumber,
      transform: {
        pos: new Vector3(133, world.getTerrainHeight(133, 131), 131),
        rot: new Vector3(0, 0, 0),
        scale: modelFactory.OverrideScale >= 0 ? modelFactory.OverrideScale : 1,
      },
      modelFactory,
      pathfinding: {
        from: { x: 0, y: 0 },
        to: { x: 0, y: 0 },
        path: [],
        calculated: true,
      },
      playerMoveTo: {
        point: { x: 0, y: 0 },
        handled: true as boolean,
      },
      movement: {
        velocity: { x: 0, y: 0 },
      },
      monsterAnimation: {
        action: MonsterActionType.Stop1,
      },
      attributeSystem: createAttributeSystem(),
      visibility: {
        lastChecked: 0,
        state: 'hidden',
      },
      screenPosition: {
        worldOffsetZ: 2.5,
        x: 0,
        y: 0,
      },
      objectNameInWorld: 'NPC',
      interactable: true,
    });

    npcEntity.attributeSystem.setValue('isFemale', 0);
    npcEntity.attributeSystem.setValue('isFlying', 0);
  }
}
