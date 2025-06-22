import { getModel } from '../modelLoader';
import { MODEL_PLAYER, PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(371, "Leo the Helper")]
export class Leo extends PlayerObject {
  async init() {
    const bmd = await getModel(MODEL_PLAYER);

    this.load(bmd);

    this.setBodyPartsAsync(
      './data/Player/',
      'HelmMale',
      'ArmorMale',
      'PantMale',
      'GloveMale',
      'BootMale',
      10
    );

    this.CurrentAction = PlayerAction.PLAYER_STOP_MALE;
  }
  // protected override void HandleClick() { }
}
