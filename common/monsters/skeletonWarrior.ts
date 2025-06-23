import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(14, "Skeleton Warrior")]
export class SkeletonWarrior extends ModelObject {
  async init() {
    const bmd = await loadBMD('Skill/Skeleton01.bmd');

    this.load(bmd);
  }
}
