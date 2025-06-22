import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(251, "Hanzo The Blacksmith")]
export class Hanzo extends ModelObject {
  async init() {
    const bmd = await loadBMD('./data/NPC/Smith01.bmd', './data/NPC/');

    this.load(bmd);
  }
}
