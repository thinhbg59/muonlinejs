import type { Entity, World } from '../../ecs/world';
import { loadGLTF } from '../modelLoader';
import { PlayerAction } from '../objects/enum';
import { PlayerObject } from '../playerObject';

// [NpcInfo(257, "Elf Soldier")]
export class ElfSoldier extends PlayerObject {
  async init(world: World, entity: Entity) {
    this.load(await loadGLTF('Player/player.glb', world));

    await this.setBodyPartsAsync(
      'Player/',
      'HelmMale',
      'ArmorMale',
      'PantMale',
      'GloveMale',
      'BootMale',
      25
    );

    await this.loadPartAsync('Item/', this.Wings, `Wing04.glb`);

    const wingsMaterial = this.Wings.getMaterial(0);
    if (wingsMaterial) {
      wingsMaterial.transparencyMode = 2;
      wingsMaterial.alphaMode = 1;
      wingsMaterial.alpha = 0.99;
    }

    const pantsMaterial = this.Pants.getMaterial(3);
    if (pantsMaterial) {
      wingsMaterial.transparencyMode = 2;
      wingsMaterial.alphaMode = 1;
      wingsMaterial.alpha = 0.99;
    }

    this.CurrentAction = PlayerAction.PLAYER_STOP_FLY;
    world.removeComponent(entity, 'monsterAnimation');
  }
  // protected override void HandleClick() { }
}
