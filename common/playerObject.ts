import {
  BoundingBox,
  Vector3,
  type Scene,
  type TransformNode,
} from '@babylonjs/core';
import { ModelObject } from './modelObject';
import { PlayerClass } from './types';
import { BMD } from './BMD';
import { World } from '../src/ecs/world';
import { PlayerAction } from './objects/enum';
import { loadBMD } from './modelLoader';

export class PlayerObject extends ModelObject {
  playerClass: PlayerClass = PlayerClass.DarkKnight;

  readonly HelmMask: ModelObject;
  readonly Helm: ModelObject;
  readonly Armor: ModelObject;
  readonly Pants: ModelObject;
  readonly Gloves: ModelObject;
  readonly Boots: ModelObject;
  readonly Weapon1: ModelObject;
  readonly Weapon2: ModelObject;
  readonly Wings: ModelObject;

  constructor(scene: Scene, parent: TransformNode) {
    super(scene, parent);

    this.BoundingBoxLocal = new BoundingBox(
      new Vector3(-40, -40, 0),
      new Vector3(40, 40, 120)
    );

    this.CurrentAction = PlayerAction.PLAYER_SKILL_INFERNO;

    this.HelmMask = new ModelObject(scene, this._node);
    this.Helm = new ModelObject(scene, this._node);
    this.Armor = new ModelObject(scene, this._node);
    this.Pants = new ModelObject(scene, this._node);
    this.Gloves = new ModelObject(scene, this._node);
    this.Boots = new ModelObject(scene, this._node);
    this.Weapon1 = new ModelObject(scene, this._node);
    this.Weapon2 = new ModelObject(scene, this._node);
    this.Wings = new ModelObject(scene, this._node);

    const objs = [
      this.HelmMask,
      this.Helm,
      this.Armor,
      this.Pants,
      this.Gloves,
      this.Boots,
      this.Weapon1,
      this.Weapon2,
      this.Wings,
    ];

    objs.forEach(obj => {
      obj.setParent(this);
      obj.LinkParent = true;
    });

    this.Wings.LinkParent = false;
    this.Wings.ParentBoneLink = 47;
  }

  async init() {
    await super.init();

    this.load(await loadBMD('./data/Player/player.bmd'));
  }

  load(bmd: BMD): void {
    super.load(bmd);

    this.updateBodyPartClassesAsync();
  }

  async updateBodyPartClassesAsync() {
    await this.setBodyPartsAsync(
      './data/Player/',
      'HelmClass',
      'ArmorClass',
      'PantClass',
      'GloveClass',
      'BootClass',
      this.playerClass
    );

    // await this.loadPartAsync('./data/Item/', this.Wings, `Wing03.bmd`);
  }

  async setBodyPartsAsync(
    pathPrefix: string,
    helmPrefix: string,
    armorPrefix: string,
    pantPrefix: string,
    glovePrefix: string,
    bootPrefix: string,
    skinIndex: number
  ) {
    // Format skin index to two digits (e.g., 1 -> "01", 10 -> "10")
    const fileSuffix = skinIndex.toString().padStart(2, '0');

    await Promise.all([
      !helmPrefix
        ? Promise.resolve()
        : this.loadPartAsync(
            pathPrefix,
            this.Helm,
            `${helmPrefix}${fileSuffix}.bmd`
          ),
      !armorPrefix
        ? Promise.resolve()
        : this.loadPartAsync(
            pathPrefix,
            this.Armor,
            `${armorPrefix}${fileSuffix}.bmd`
          ),
      !pantPrefix
        ? Promise.resolve()
        : this.loadPartAsync(
            pathPrefix,
            this.Pants,
            `${pantPrefix}${fileSuffix}.bmd`
          ),
      !glovePrefix
        ? Promise.resolve()
        : this.loadPartAsync(
            pathPrefix,
            this.Gloves,
            `${glovePrefix}${fileSuffix}.bmd`
          ),
      !bootPrefix
        ? Promise.resolve()
        : this.loadPartAsync(
            pathPrefix,
            this.Boots,
            `${bootPrefix}${fileSuffix}.bmd`
          ),
    ]);
  }

  async loadPartAsync(dir: string, part: ModelObject, modelPath: string) {
    const bmd = await loadBMD(dir + modelPath);
    part.load(bmd);
  }

  Update(gameTime: World['gameTime']): void {
    super.Update(gameTime);

    // Update all children
    for (const child of this.Children) {
      child.Update(gameTime);
    }
  }

  Draw(gameTime: World['gameTime']): void {
    super.Draw(gameTime);

    // Update all children
    for (const child of this.Children) {
      child.Draw(gameTime);
    }
  }
}
