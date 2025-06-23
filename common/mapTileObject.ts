import { loadBMD } from './modelLoader';
import { ModelObject } from './modelObject';

export class MapTileObject extends ModelObject {
  async init(world, entity) {
    await super.init(world, entity);

    // BlendState = BlendState.AlphaBlend;

    const dir = `Object${this.WorldIndex + 1}/`;
    const modelPath = `${dir}Object${(this.Type + 1)
      .toString()
      .padStart(2, '0')}.bmd`;

    this.load(await loadBMD(modelPath));
  }
}
