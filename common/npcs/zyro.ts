import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(568, "Wandering Merchant Zyro")]
export class Zyro extends ModelObject {
  async init() {
    const bmd = await loadBMD('./data/NPC/volvo.bmd');

    this.load(bmd);
  }
}
