import { ModelObject } from '../../../common/modelObject';
import { MODEL_HOUSE_WALL01 } from '../../../common/objects/enum';

export class HouseWallObject extends ModelObject {
  async init() {
    // LightEnabled = true;

    await this.loadSpecificModelWithDynamicID(MODEL_HOUSE_WALL01, 'HouseWall');
  }
}
