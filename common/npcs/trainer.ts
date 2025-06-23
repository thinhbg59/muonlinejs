import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

export class Trainer extends ModelObject {
  init: ModelObject['init'] = async () => {
    const bmd = await loadBMD('NPC/Breeder.bmd');

    this.load(bmd);
  };
}
