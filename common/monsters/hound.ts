import { loadBMD } from '../modelLoader';
import { MonsterObject } from '../monsterObject';

// [NpcInfo(1, "Hound")]
export class Hound extends MonsterObject {
  static {
    Hound.OverrideScale = 0.85;
  }

  async init() {
    const bmd = await loadBMD(
      './data/Monster/Monster01.bmd',
      './data/Monster/'
    );

    super.load(bmd);
  }
}
