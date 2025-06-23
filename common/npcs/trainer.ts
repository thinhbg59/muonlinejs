import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

export class Trainer extends ModelObject {
  async init() {
    const bmd = await loadBMD('NPC/Breeder.bmd');

    this.load(bmd);
  }
}
