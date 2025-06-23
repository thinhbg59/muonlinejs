import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

// [NpcInfo(251, "Hanzo The Blacksmith")]
export class Hanzo extends ModelObject {
  init: ModelObject['init'] = async () => {
    this.load(await loadBMD('NPC/Smith01.bmd'));
  };
}
