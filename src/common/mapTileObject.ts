import { Entity, World } from '../ecs/world';
import { Color3 } from '../libs/babylon/exports';
import { loadGLTF } from './modelLoader';
import { ModelObject } from './modelObject';
import { mapNumber } from './utils';

export class MapTileObject extends ModelObject {
  #modelPath: string = '';

  async init(world: World, entity: Entity) {
    await super.init(world, entity);

    // BlendState = BlendState.AlphaBlend;

    const dir = `Object${this.WorldIndex + 1}/`;
    const modelPath = `${dir}Object${(this.Type + 1)
      .toString()
      .padStart(2, '0')}.glb`;

    this.#modelPath = modelPath;

    this.load(await loadGLTF(modelPath, world));

    if (modelPath === 'Object3/Object20.glb') {
      const m = this.getMaterial(0);
      m.transparencyMode = 2;
      m.alphaMode = 1;
      m.backFaceCulling = false;
    } else if (modelPath === 'Object8/Object39.glb') {
      const m = this.getMaterial(0);
      m.transparencyMode = 2;
      m.alphaMode = 1;
      m.backFaceCulling = false;
    }
    // atlans bubbles
    else if (modelPath === 'Object8/Object23.glb') {
      const m = this.getMaterial(0);
      m.transparencyMode = 2;
      m.alphaMode = 1;
    }
    // atlans water entrance
    else if (modelPath === 'Object8/Object24.glb') {
      const m = this.getMaterial(0);
      m.transparencyMode = 2;
      m.alphaMode = 1;
      m.backFaceCulling = false;
      m.diffuseColor = Color3.FromHexString('#2F63B1');
    }
  }

  Update(gameTime: World['gameTime']): void {
    super.Update(gameTime);

    if (!this.Ready) return;

    if (this.#modelPath === 'Object8/Object24.glb') {
      const alpha =
        Math.sin(gameTime.TotalGameTime.TotalSeconds * 2) * 0.5 + 0.5;
      const m = this.getMaterial(0);
      m.alpha = mapNumber(alpha, 0, 1, 0.2, 1);
    }
  }
}
