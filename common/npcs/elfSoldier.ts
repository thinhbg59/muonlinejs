import { loadBMD } from '../modelLoader';
import { PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(257, "Elf Soldier")]
export class ElfSoldier extends PlayerObject {
  async init() {
    this.load(await loadBMD('./data/Player/player.bmd'));

    this.setBodyPartsAsync(
      './data/Player/',
      'HelmElf',
      'ArmorElf',
      'PantElf',
      'GloveElf',
      'BootElf',
      5
    );

    await this.loadPartAsync('./data/Item/', this.Wings, `Wing04.bmd`);

    this.CurrentAction = PlayerAction.PLAYER_STOP_FLY;
  }
  // protected override void HandleClick() { }
}
