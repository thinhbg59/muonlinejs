import { ModelObject } from '../../../common/modelObject';

export class WaterSpoutObject extends ModelObject {
  async init() {
    // LightEnabled = true;

    await this.loadSpecificModel(`Waterspout01.bmd`);
  }
}
