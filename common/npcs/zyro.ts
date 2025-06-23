import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(568, "Wandering Merchant Zyro")]
export class Zyro extends ModelObject {
  init: ModelObject['init'] = async () => {
    const bmd = await loadBMD('NPC/volvo.bmd');

    this.load(bmd);
  };
}
