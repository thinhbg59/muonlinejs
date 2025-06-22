import { loadBMD } from '../modelLoader';
import { MonsterObject } from '../monsterObject';
import { MonsterActionType } from '../objects/enum';

// [NpcInfo(2, "Budge Dragon")]
export class BudgeDragon extends MonsterObject {
  static {
    BudgeDragon.OverrideScale = 0.5;
  }

  async init() {
    const bmd = await loadBMD(
      './data/Monster/Monster03.bmd',
      './data/Monster/'
    );

    super.load(bmd);

    const action = this.Model?.Actions[MonsterActionType.Walk];
    if (action) {
      action.PlaySpeed = 0.7;
    }
  }
}
