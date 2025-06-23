import { With } from 'miniplex';
import { MapPlayerNetClassToModelClass } from '../../../common/mapPlayerNetClassToModelClass';
import { getModel, loadBMD, ObjectRegistry } from '../../../common/modelLoader';
import { ModelObject } from '../../../common/modelObject';
import { MODEL_ELF_WIZARD } from '../../../common/objects/enum';
import { PlayerObject } from '../../../common/playerObject';
import { Entity, ISystemFactory, World } from '../world';

// function registerMonsters() {
//   ObjectRegistry.RegisterFactory(
//     MODEL_MONSTER01 + 1,
//     './data/Monster/',
//     'Monster02'
//   );
// }

function registerNpcs() {
  ObjectRegistry.RegisterFactory(
    MODEL_ELF_WIZARD,
    './data/NPC/',
    'ElfWizard',
    1
  );
}

registerNpcs();

const v3Temp = { x: 0, y: 0, z: 0 };

function createModelObject(
  world: World,
  entity: With<Entity, 'modelFactory' | 'worldIndex' | 'transform'>
) {
  const terrainScale = world.terrainScale;
  const transform = entity.transform;
  const modelId = entity.modelId;

  world.addComponent(
    entity,
    'modelObject',
    new entity.modelFactory(world.scene, world.mapParent)
  );

  const modelObject = entity.modelObject as any as ModelObject;
  modelObject.WorldIndex = entity.worldIndex;
  if (modelId !== undefined) {
    modelObject.Type = modelId;
  }

  v3Temp.x = transform.pos.x * terrainScale;
  v3Temp.y = transform.pos.y * terrainScale;
  v3Temp.z = transform.pos.z * terrainScale;

  modelObject.updateLocation(v3Temp, transform.scale, transform.rot);

  if (
    entity.modelFactory === PlayerObject &&
    entity.attributeSystem?.hasAttribute('playerNetClass')
  ) {
    (modelObject as PlayerObject).playerClass = MapPlayerNetClassToModelClass(
      entity.attributeSystem.getValue('playerNetClass')
    );
  }

  modelObject.init(world).then(() => {
    if (modelObject.Model || modelObject.Ready) return;
    if (!entity.modelObject) {
      modelObject.dispose();
      return;
    }

    const modelFilePath = entity.modelFilePath;

    if (modelId != null) {
      getModel(modelId).then(bmd => {
        if (entity.modelObject) {
          entity.modelObject.load(bmd);
          // console.log(`Model loaded: ${entity.modelId} - ${bmd.Name}`);
        }
      });
    } else if (modelFilePath) {
      loadBMD(modelFilePath).then(bmd => {
        if (entity.modelObject) {
          entity.modelObject.load(bmd);
          // console.log(`Model loaded: ${entity.modelId} - ${bmd.Name}`);
        }
      });
    }
  });
}

export const ModelLoaderSystem: ISystemFactory = world => {
  const query = world.with(
    'modelFactory',
    'worldIndex',
    'transform',
    'visibility'
  );

  return {
    update: () => {
      const terrain = world.terrain;
      if (!terrain) return;

      for (const entity of query) {
        const visibility = entity.visibility;

        switch (visibility.state) {
          case 'visible':
          case 'nearby': {
            if (!entity.modelObject) {
              createModelObject(world, entity);
            }
            break;
          }
          case 'hidden': {
            if (entity.modelObject) {
              entity.modelObject.dispose();
              world.removeComponent(entity, 'modelObject');
            }
            break;
          }
        }
      }
    },
  };
};
