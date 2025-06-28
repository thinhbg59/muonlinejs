import {
  AnimationGroup,
  Bone,
  PBRBaseSimpleMaterial,
  Skeleton,
  Texture,
  type AbstractMesh,
} from '../libs/babylon/exports';
import type { World } from '../ecs/world';
import { BMD, BMDReader } from './BMD';
import { downloadDataBytesBuffer } from './utils';
import { resolveUrlToDataFolder } from './resolveUrlToDataFolder';

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
          // const meshes = task.loadedMeshes;
          // for (let i = 1; i < meshes.length; i++) {
          //   this.prepareMesh(meshes[i]);
          // }
          // console.log(task);
          // task.loadedMeshes[0].dispose();
          task.loadedMeshes[0].name = fileName;

          task.loadedMeshes.forEach(mesh => {
            mesh.alwaysSelectAsActiveMesh = true;
            mesh.isPickable = false;
            mesh.doNotSyncBoundingInfo = false;

            if (mesh.material) {
              const m = mesh.material as PBRBaseSimpleMaterial;
              m._metallicF0Factor = 0;

              if (m._albedoTexture) {
                m._albedoTexture.anisotropicFilteringLevel = 1;
                m._albedoTexture.updateSamplingMode(Texture.NEAREST_NEAREST);
              }
            }
          });

          // if (task.loadedAnimationGroups.length > 0) {
          //   task.loadedAnimationGroups[0].play(true);
          // }

          task.loadedSkeletons.forEach(skeleton => {
            skeleton.name = `skeleton_${fileName}`;
          });

          let skeleton = task.loadedSkeletons[0];

          if (task.loadedSkeletons.length === 0) {
            const s = new Skeleton(
              `skeleton_${fileName}`,
              `skeleton_${fileName}_${skelId++}`,
              world.scene
            );
            skeleton = s;

            const root = task.loadedMeshes[0]!;
            const skinRootNode = root.getChildTransformNodes(true, n =>
              n.name.startsWith('skin_')
            )[0]!;

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
