import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(254, "Pasi the Mage")]
export class Pasi extends ModelObject {
  init: ModelObject['init'] = async () => {
    const bmd = await loadBMD('NPC/Wizard01.bmd');

    this.load(bmd);
  };
}
