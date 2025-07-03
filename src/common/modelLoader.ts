import {
  AnimationGroup,
  Bone,
  CustomMaterial,
  PBRBaseSimpleMaterial,
  Scene,
  Skeleton,
  Texture,
  type AbstractMesh,
} from '../libs/babylon/exports';
import type { World } from '../ecs/world';
import { BMD, BMDReader } from './BMD';
import { downloadDataBytesBuffer } from './utils';
import { resolveUrlToDataFolder } from './resolveUrlToDataFolder';
import { createItemMaterial } from './itemMaterial';
import { getEmptyTexture } from '../libs/babylon/emptyTexture';
import { BlendState } from './objects/enum';

const reader = new BMDReader();
const Models: Partial<Record<number, Promise<BMD>>> = {};
const ModelsFactory: Record<number, () => Promise<BMD>> = {};

export async function getModel(modelId: number) {
  if (Models[modelId]) return Models[modelId];

  if (!ModelsFactory[modelId])
    throw new Error(`Model factory for ID ${modelId} not found`);

  Models[modelId] = ModelsFactory[modelId]();
  return Models[modelId];
}

const cache: Partial<Record<string, Promise<BMD>>> = {};

export async function loadBMD(filePath: string): Promise<BMD> {
  if (cache[filePath]) return cache[filePath];

  const dir = filePath.split('/').slice(0, -1).join('/') + '/';

  cache[filePath] = new Promise(async r => {
    try {
      r(reader.read(await downloadDataBytesBuffer(filePath), dir));
    } catch (error) {
      console.error(`Error loading BMD from ${filePath}:`, error);
      throw error;
    }
  });

  return cache[filePath];
}

let skelId = 100;

const materialsCache: Map<string, CustomMaterial> = new Map();

export function getMaterial(
  scene: Scene,
  backFaceCulling: boolean,
  transparencyMode: number,
  alphaMode: BlendState
) {
  const name = `${backFaceCulling}_${transparencyMode}_${BlendState[alphaMode]}`;

  if (materialsCache.has(name)) return materialsCache.get(name)!;

  const material = createItemMaterial(scene);
  material.name = name;
  material.backFaceCulling = backFaceCulling;
  material.transparencyMode = transparencyMode;
  material.useAlphaFromDiffuseTexture = true;
  material.diffuseTexture = getEmptyTexture(scene);
  material.alphaMode = alphaMode;

  material.freeze();

  materialsCache.set(name, material);

  return material;
}

const texturesCache: Map<string, Texture> = new Map();

function getTexture(key: string, fallback: Texture) {
  if (texturesCache.has(key)) return texturesCache.get(key)!;

  fallback.isBlocking = false;
  fallback.updateSamplingMode(Texture.NEAREST_NEAREST);

  texturesCache.set(key, fallback);

  return fallback;
}

export async function loadGLTF(filePath: string, world: World) {
  filePath = resolveUrlToDataFolder(filePath);
  const fileName = filePath.split('/').at(-1)!;

  return new Promise<{
    mesh: AbstractMesh;
    skeleton: Skeleton;
    animationGroups: AnimationGroup[];
  }>(resolve => {
    const task = world.assetsManager.addMeshTask(
      fileName,
      undefined,
      filePath,
      ''
    );

    const loadTask = () =>
      task.run(
        world.scene,
        () => {
          task.loadedMeshes[0].name = fileName;

          task.loadedMeshes.forEach(mesh => {
            mesh.metadata ??= {};
            mesh.metadata.itemLvl = 0;
            mesh.metadata.isExcellent = false;
            mesh.metadata.timeOffset = 0;
            mesh.alwaysSelectAsActiveMesh = true;
            mesh.isPickable = false;
            mesh.doNotSyncBoundingInfo = false;

            const m = mesh.material as PBRBaseSimpleMaterial;
            if (m && !!m._albedoTexture) {
              const cached = getTexture(
                fileName + m._albedoTexture.name,
                m._albedoTexture as Texture
              );
              const diffuseTexture = cached;

              const clonedMaterial = getMaterial(
                world.scene,
                m.backFaceCulling,
                m.transparencyMode ?? 0,
                m.alphaMode ?? BlendState.ALPHA_DISABLE
              );
              mesh.visibility = m.alpha;
              mesh.metadata.diffuseTexture = diffuseTexture;

              if (m._albedoTexture !== cached) {
                m._albedoTexture.dispose();
              }
              m._albedoTexture = null;

              mesh.material = clonedMaterial;
              m.dispose(true, false);
            }

            if (mesh.skeleton) {
              mesh.numBoneInfluencers = 1;
            }
          });

          // if (task.loadedAnimationGroups.length > 0) {
          //   task.loadedAnimationGroups[0].play(true);
          // }

          task.loadedSkeletons.forEach(skeleton => {
            skeleton.name = `skeleton_${fileName}`;
          });

          let skeleton = task.loadedSkeletons[0];

          if (
            task.loadedSkeletons.length === 0 &&
            filePath.includes('player.glb')
          ) {
            const s = new Skeleton(
              `skeleton_${fileName}`,
              `skeleton_${fileName}_${skelId++}`,
              world.scene
            );
            skeleton = s;

            const map = new Map<any, Bone>();
            const str: string[] = [];
            const skeletonNodesStartIndex = task.loadedTransformNodes.findIndex(
              n => n.name.startsWith('skin_')
            );

            if (skeletonNodesStartIndex !== -1) {
              const nodes = task.loadedTransformNodes.slice(
                skeletonNodesStartIndex
              );
              for (const node of nodes) {
                str.push(node.name);
                const bone = new Bone(node.name, s, null);
                bone.linkTransformNode(node);
                map.set(node, bone);
                bone.parent = node.parent
                  ? map.get(node.parent!) ?? null
                  : null;
              }
            }

            s.prepare();
          }

          resolve({
            mesh: task.loadedMeshes[0]!,
            skeleton,
            animationGroups: task.loadedAnimationGroups,
          });
        },
        () => {
          // wait(2000).finally(() => loadTask());
        }
      );

    loadTask();
  });
}
