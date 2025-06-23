import { loadBMD } from '../modelLoader';
import { MonsterObject } from '../monsterObject';
import { MonsterActionType } from '../objects/enum';

// [NpcInfo(3, "Spider")]
export class Spider extends MonsterObject {
  static {
    Spider.OverrideScale = 0.4;
  }

  async init() {
    const bmd = await loadBMD('Monster/Monster10.bmd');

    super.load(bmd);

    this.setActionSpeed(MonsterActionType.Walk, 1.2);
    this.setActionSpeed(MonsterActionType.Attack1, 1.2);
  }
}
