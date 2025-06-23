import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(375, "Chaos Card Master")]
export class ChaosCardMaster extends ModelObject {
  async init() {
    // TODO
    const bmd = await loadBMD('./data/NPC/Smith01.bmd');

    this.load(bmd);
  }
}
