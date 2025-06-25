import { Entity, World } from '../src/ecs/world';
import { loadGLTF } from './modelLoader';
import { ModelObject } from './modelObject';

export class MapTileObject extends ModelObject {
  async init(world: World, entity: Entity) {
    await super.init(world, entity);

    // BlendState = BlendState.AlphaBlend;

    const dir = `Object${this.WorldIndex + 1}/`;
    const modelPath = `${dir}Object${(this.Type + 1)
      .toString()
      .padStart(2, '0')}.glb`;

    this.load(await loadGLTF(modelPath, world));
  }
}
