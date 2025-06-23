import { ModelObject } from '../../../common/modelObject';
import { MODEL_HOUSE01 } from '../../../common/objects/enum';

export class HouseObject extends ModelObject {
  async init() {
    // LightEnabled = true;

    await this.loadSpecificModelWithDynamicID(MODEL_HOUSE01, 'House');
  }
}
