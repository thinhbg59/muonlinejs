import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(14, "Skeleton Warrior")]
export class SkeletonWarrior extends ModelObject {
  async init() {
    const bmd = await loadBMD('./data/Skill/Skeleton01.bmd', './data/Skill/');

    this.load(bmd);
  }
}
