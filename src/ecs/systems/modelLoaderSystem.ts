import { getModel, ObjectRegistry } from '../../../common/modelLoader';
import { ModelObject } from '../../../common/modelObject';
import {
  MODEL_BEER01,
  MODEL_BONFIRE,
  MODEL_BRIDGE,
  MODEL_BRIDGE_STONE,
  MODEL_CANDLE,
  MODEL_CANNON01,
  MODEL_CARRIAGE01,
  MODEL_CURTAIN,
  MODEL_DUNGEON_GATE,
  MODEL_ELF_WIZARD,
  MODEL_FENCE01,
  MODEL_FIRE_LIGHT01,
  MODEL_FURNITURE01,
  MODEL_GRASS01,
  MODEL_HANGING,
  MODEL_HOUSE01,
  MODEL_HOUSE_ETC01,
  MODEL_HOUSE_WALL01,
  MODEL_LIGHT01,
  MODEL_MERCHANT_ANIMAL01,
  MODEL_MONSTER01,
  MODEL_MU_WALL01,
  MODEL_PLAYER,
  MODEL_POSE_BOX,
  MODEL_SHIP,
  MODEL_SIGN01,
  MODEL_STAIR,
  MODEL_STEEL_DOOR,
  MODEL_STEEL_STATUE,
  MODEL_STEEL_WALL01,
  MODEL_STONE01,
  MODEL_STONE_STATUE01,
  MODEL_STONE_WALL01,
  MODEL_STRAW01,
  MODEL_STREET_LIGHT,
  MODEL_TENT,
  MODEL_TOMB01,
  MODEL_TREASURE_CHEST,
  MODEL_TREASURE_DRUM,
  MODEL_TREE01,
  MODEL_WATERSPOUT,
  MODEL_WELL01,
} from '../../../common/objects/enum';
import { ISystemFactory } from '../world';

function registerObjects() {
  let i = 0;

  for (i = 0; i < 13; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_TREE01 + i,
      './data/Object1/',
      'Tree',
      i + 1
    );
  for (i = 0; i < 8; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_GRASS01 + i,
      './data/Object1/',
      'Grass',
      i + 1
    );
  for (i = 0; i < 5; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_STONE01 + i,
      './data/Object1/',
      'Stone',
      i + 1
    );

  for (i = 0; i < 3; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_STONE_STATUE01 + i,
      './data/Object1/',
      'StoneStatue',
      i + 1
    );

  ObjectRegistry.RegisterFactory(
    MODEL_STEEL_STATUE,
    './data/Object1/',
    'SteelStatue',
    1
  );

  for (i = 0; i < 3; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_TOMB01 + i,
      './data/Object1/',
      'Tomb',
      i + 1
    );

  for (i = 0; i < 2; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_FIRE_LIGHT01 + i,
      './data/Object1/',
      'FireLight',
      i + 1
    );

  ObjectRegistry.RegisterFactory(
    MODEL_BONFIRE,
    './data/Object1/',
    'Bonfire',
    1
  );
  ObjectRegistry.RegisterFactory(
    MODEL_DUNGEON_GATE,
    './data/Object1/',
    'DoungeonGate',
    1
  );
  ObjectRegistry.RegisterFactory(
    MODEL_TREASURE_DRUM,
    './data/Object1/',
    'TreasureDrum',
    1
  );
  ObjectRegistry.RegisterFactory(
    MODEL_TREASURE_CHEST,
    './data/Object1/',
    'TreasureChest',
    1
  );
  ObjectRegistry.RegisterFactory(MODEL_SHIP, './data/Object1/', 'Ship', 1);

  for (i = 0; i < 6; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_STONE_WALL01 + i,
      './data/Object1/',
      'StoneWall',
      i + 1
    );
  for (i = 0; i < 4; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_MU_WALL01 + i,
      './data/Object1/',
      'StoneMuWall',
      i + 1
    );
  for (i = 0; i < 3; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_STEEL_WALL01 + i,
      './data/Object1/',
      'SteelWall',
      i + 1
    );
  ObjectRegistry.RegisterFactory(
    MODEL_STEEL_DOOR,
    './data/Object1/',
    'SteelDoor',
    1
  );
  for (i = 0; i < 3; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_CANNON01 + i,
      './data/Object1/',
      'Cannon',
      i + 1
    );
  ObjectRegistry.RegisterFactory(MODEL_BRIDGE, './data/Object1/', 'Bridge', 1);
  for (i = 0; i < 4; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_FENCE01 + i,
      './data/Object1/',
      'Fence',
      i + 1
    );
  ObjectRegistry.RegisterFactory(
    MODEL_BRIDGE_STONE,
    './data/Object1/',
    'BridgeStone',
    1
  );

  ObjectRegistry.RegisterFactory(
    MODEL_STREET_LIGHT,
    './data/Object1/',
    'StreetLight',
    1
  );
  ObjectRegistry.RegisterFactory(
    MODEL_CURTAIN,
    './data/Object1/',
    'Curtain',
    1
  );
  for (i = 0; i < 4; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_CARRIAGE01 + i,
      './data/Object1/',
      'Carriage',
      i + 1
    );
  for (i = 0; i < 2; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_STRAW01 + i,
      './data/Object1/',
      'Straw',
      i + 1
    );
  for (i = 0; i < 2; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_SIGN01 + i,
      './data/Object1/',
      'Sign',
      i + 1
    );
  for (i = 0; i < 2; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_MERCHANT_ANIMAL01 + i,
      './data/Object1/',
      'MerchantAnimal',
      i + 1
    );
  ObjectRegistry.RegisterFactory(
    MODEL_WATERSPOUT,
    './data/Object1/',
    'Waterspout',
    1
  );
  for (i = 0; i < 4; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_WELL01 + i,
      './data/Object1/',
      'Well',
      i + 1
    );
  ObjectRegistry.RegisterFactory(
    MODEL_HANGING,
    './data/Object1/',
    'Hanging',
    1
  );

  for (i = 0; i < 5; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_HOUSE01 + i,
      './data/Object1/',
      'House',
      i + 1
    );
  ObjectRegistry.RegisterFactory(MODEL_TENT, './data/Object1/', 'Tent', 1);
  ObjectRegistry.RegisterFactory(MODEL_STAIR, './data/Object1/', 'Stair', 1);

  for (i = 0; i < 6; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_HOUSE_WALL01 + i,
      './data/Object1/',
      'HouseWall',
      i + 1
    );
  for (i = 0; i < 3; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_HOUSE_ETC01 + i,
      './data/Object1/',
      'HouseEtc',
      i + 1
    );
  for (i = 0; i < 3; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_LIGHT01 + i,
      './data/Object1/',
      'Light',
      i + 1
    );
  ObjectRegistry.RegisterFactory(
    MODEL_POSE_BOX,
    './data/Object1/',
    'PoseBox',
    1
  );

  for (i = 0; i < 7; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_FURNITURE01 + i,
      './data/Object1/',
      'Furniture',
      i + 1
    );
  ObjectRegistry.RegisterFactory(MODEL_CANDLE, './data/Object1/', 'Candle', 1);
  for (i = 0; i < 3; i++)
    ObjectRegistry.RegisterFactory(
      MODEL_BEER01 + i,
      './data/Object1/',
      'Beer',
      i + 1
    );
}

function registerMonsters() {
  ObjectRegistry.RegisterFactory(
    MODEL_MONSTER01 + 1,
    './data/Monster/',
    'Monster02'
  );
}

function registerNpcs() {
  ObjectRegistry.RegisterFactory(
    MODEL_ELF_WIZARD,
    './data/NPC/',
    'ElfWizard',
    1
  );

  ObjectRegistry.RegisterFactory(MODEL_PLAYER, './data/Player/', 'player');
}

registerObjects();
registerMonsters();
registerNpcs();

export const ModelLoaderSystem: ISystemFactory = world => {
  const query = world.with('modelFactory');

  return {
    update: () => {
      for (const entity of query) {
        if (!entity.modelObject) {
          world.addComponent(
            entity,
            'modelObject',
            new entity.modelFactory(world.scene, world.mapParent)
          );

          const modelObject = entity.modelObject as any as ModelObject;

          modelObject.init().then(() => {
            const modelId = entity.modelId;

            if (modelId != null) {
              getModel(modelId).then(bmd => {
                if (entity.modelObject) {
                  entity.modelObject.load(bmd);
                  // console.log(`Model loaded: ${entity.modelId} - ${bmd.Name}`);
                }
              });
            }
          });
        }
      }
    },
  };
};
