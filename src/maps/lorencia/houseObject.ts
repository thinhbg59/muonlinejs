import { ModelObject } from '../../common/modelObject';
import { MODEL_HOUSE01 } from '../../common/objects/enum';

export class HouseObject extends ModelObject {
  async init() {
    // LightEnabled = true;
    await this.loadSpecificModelWithDynamicID(MODEL_HOUSE01, 'House');

    const idx = this.Type - MODEL_HOUSE01 + 1;

    if (idx === 3) {
      const m = this.getMaterial(4);
      if (m) {
        m.alpha = 0.99;
        m.transparencyMode = 2;
        m.alphaMode = 1;
      }
    } else if (idx === 4) {
      const m = this.getMaterial(8);
      if (m) {
        m.alpha = 0.99;
        m.transparencyMode = 2;
        m.alphaMode = 1;
      }
    }
  }
}
