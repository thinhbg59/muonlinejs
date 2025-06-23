import { loadBMD } from '../modelLoader';
import { MonsterObject } from '../monsterObject';
import { MonsterActionType } from '../objects/enum';

// [NpcInfo(2, "Budge Dragon")]
export class BudgeDragon extends MonsterObject {
  static {
    BudgeDragon.OverrideScale = 0.5;
  }

  async init() {
    this.load(await loadBMD('Monster/Monster03.bmd'));

    this.setActionSpeed(MonsterActionType.Walk, 0.7);
  }
}
