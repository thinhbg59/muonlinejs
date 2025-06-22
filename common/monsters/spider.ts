import { loadBMD } from '../modelLoader';
import { MonsterObject } from '../monsterObject';
import { MonsterActionType } from '../objects/enum';

// [NpcInfo(3, "Spider")]
export class Spider extends MonsterObject {
  static {
    Spider.OverrideScale = 0.4;
  }

  async init() {
    const bmd = await loadBMD(
      './data/Monster/Monster10.bmd',
      './data/Monster/'
    );

    super.load(bmd);

    const action = this.Model?.Actions[MonsterActionType.Walk];
    if (action) {
      action.PlaySpeed = 1.2;
    }
  }
}
