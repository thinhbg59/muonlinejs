import { loadBMD } from '../modelLoader';
import { PlayerObject } from '../playerObject';

// [NpcInfo(255, "Lumen the Barmaid")]
export class Lumen extends PlayerObject {
  async init() {
    const bmd = await loadBMD('./data/NPC/Female01.bmd', './data/NPC/');

    this.load(bmd);

    this.setBodyPartsAsync(
      './data/NPC/',
      'FemaleHead',
      'FemaleUpper',
      'FemaleLower',
      '',
      'FemaleBoots',
      2
    );
  }
  // protected override void HandleClick() { }
}
