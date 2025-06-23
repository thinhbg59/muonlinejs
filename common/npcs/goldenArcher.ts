import { loadBMD } from '../modelLoader';
import { PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(236, "Golden Archer")]
export class GoldenArcher extends PlayerObject {
  init: PlayerObject['init'] = async (world, entity) => {
    this.load(await loadBMD('Player/player.bmd'));

    this.setBodyPartsAsync(
      'Player/',
      'HelmMale',
      'ArmorMale',
      'PantMale',
      'GloveMale',
      'BootMale',
      22
    );

    // Weapon1.Type = (int)ModelType.Bow + 5 + MODEL_ITEM; // Silver Bow as a golden-looking bow
    // Weapon1.Level = 9;

    this.CurrentAction = PlayerAction.PLAYER_STOP_MALE;
    world.removeComponent(entity, 'monsterAnimation');
  };
  // protected override void HandleClick() { }
}
