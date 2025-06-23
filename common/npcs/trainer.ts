import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

export class Trainer extends ModelObject {
  async init() {
    const bmd = await loadBMD('./data/NPC/Breeder.bmd');

    this.load(bmd);
  }
}
