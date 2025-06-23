import { loadBMD } from '../modelLoader';
import { ModelObject } from '../modelObject';

export class Baz extends ModelObject {
  async init() {
    const bmd = await loadBMD('NPC/Storage01.bmd');

    this.load(bmd);
  }
}
