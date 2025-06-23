import { loadBMD } from '../modelLoader';
import { PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(371, "Leo the Helper")]
export class Leo extends PlayerObject {
  async init() {
    this.load(await loadBMD('Player/player.bmd'));

    this.setBodyPartsAsync(
      'Player/',
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
