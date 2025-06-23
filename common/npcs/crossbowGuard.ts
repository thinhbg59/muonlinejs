import { loadBMD } from '../modelLoader';
import { PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(247, "Crossbow Guard")]
export class CrossbowGuard extends PlayerObject {
  async init() {
    this.load(await loadBMD('./data/Player/player.bmd'));

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
