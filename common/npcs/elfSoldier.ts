import { loadBMD } from '../modelLoader';
import { PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(257, "Elf Soldier")]
export class ElfSoldier extends PlayerObject {
  init: PlayerObject['init'] = async (world, entity) => {
    this.load(await loadBMD('Player/player.bmd'));

    this.setBodyPartsAsync(
      'Player/',
      'HelmElf',
      'ArmorElf',
      'PantElf',
      'GloveElf',
      'BootElf',
      5
    );

    await this.loadPartAsync('Item/', this.Wings, `Wing04.bmd`);

    this.CurrentAction = PlayerAction.PLAYER_STOP_FLY;
    world.removeComponent(entity, 'monsterAnimation');
  };
  // protected override void HandleClick() { }
}
