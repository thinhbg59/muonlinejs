import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(375, "Chaos Card Master")]
export class ChaosCardMaster extends ModelObject {
  init: ModelObject['init'] = async () => {
    // TODO
    this.load(await loadBMD('NPC/Smith01.bmd'));
  };
}
