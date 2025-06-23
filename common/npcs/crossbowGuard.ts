import { loadBMD } from '../modelLoader';
import { PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(247, "Crossbow Guard")]
export class CrossbowGuard extends PlayerObject {
  init: PlayerObject['init'] = async (world, entity) => {
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
    world.removeComponent(entity, 'monsterAnimation');
  };
  // protected override void HandleClick() { }
}
