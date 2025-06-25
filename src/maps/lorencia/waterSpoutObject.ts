import { ModelObject } from '../../../common/modelObject';
import { BlendState } from '../../../common/objects/enum';

export class WaterSpoutObject extends ModelObject {
  async init() {
    // LightEnabled = true;

    await this.loadSpecificModel(`Waterspout01.glb`);

    const m = this.getMaterial(3);
    if (m) {
      m.transparencyMode = 2;
      m.alphaMode = BlendState.ALPHA_ADD;
      m.alpha = 0.99;
    }
  }
}
