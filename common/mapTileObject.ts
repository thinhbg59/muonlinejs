import { loadBMD } from './modelLoader';
import { ModelObject } from './modelObject';

export class MapTileObject extends ModelObject {
  async init(): Promise<void> {
    await super.init();

    // BlendState = BlendState.AlphaBlend;

    const dir = `./data/Object${this.WorldIndex + 1}/`;
    const modelPath = `${dir}Object${(this.Type + 1)
      .toString()
      .padStart(2, '0')}.bmd`;

    this.load(await loadBMD(modelPath));
  }
}
