import { ModelObject } from './modelObject';
import { BudgeDragon } from './monsters/budgeDragon';
import { Hound } from './monsters/hound';
import { SkeletonWarrior } from './monsters/skeletonWarrior';
import { Spider } from './monsters/spider';
import { Baz } from './npcs/baz';
import { BerdyshGuard } from './npcs/berdyshGuard';
import { ChaosCardMaster } from './npcs/chaosCardMaster';
import { CrossbowGuard } from './npcs/crossbowGuard';
import { ElfSoldier } from './npcs/elfSoldier';
import { GoldenArcher } from './npcs/goldenArcher';
import { Hanzo } from './npcs/hanzo';
import { Leo } from './npcs/leo';
import { Lumen } from './npcs/lumen';
import { Trainer } from './npcs/trainer';
import { Zyro } from './npcs/zyro';

export const ModelFactoryPerId: Record<number, typeof ModelObject> = {
  [371]: Leo,
  [240]: Baz,
  [226]: Trainer,
  [255]: Lumen,
  [257]: ElfSoldier,
  [247]: CrossbowGuard,
  [251]: Hanzo,
  [568]: Zyro,
  [249]: BerdyshGuard,
  [543]: ElfSoldier,
  [375]: ChaosCardMaster,

  // Monsters
  [1]: Hound,
  [2]: BudgeDragon,
  [3]: Spider,
  [14]: SkeletonWarrior,
  [236]: GoldenArcher,
};
