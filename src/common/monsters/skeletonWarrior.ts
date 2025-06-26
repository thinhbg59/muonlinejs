import type { World } from '../../ecs/world';
import { loadGLTF } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(14, "Skeleton Warrior")]
export class SkeletonWarrior extends ModelObject {
  async init(world: World) {
    const bmd = await loadGLTF('Skill/Skeleton01.glb', world);

    this.load(bmd);
  }
}
