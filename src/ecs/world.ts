import { type Bucket, World as ECSWorld } from 'miniplex';
import type { IVector2Like, IVector3Like, Mesh } from '../libs/babylon/exports';
import type { ModelObject } from '../common/modelObject';
import type { MonsterActionType, PlayerAction } from '../common/objects/enum';
import type { MUAttributeSystem } from '../libs/attributeSystem';
import { TransformNode } from '../libs/babylon/exports';
import { createPathfinding } from '../libs/pathfinding';
import type { CharacterClassNumber, ENUM_WORLD } from '../common';
import { AssetsManager, Color3, Viewport } from '../libs/babylon/exports';
import type { HighlightLayer } from '../libs/babylon/exports';
import type { TestScene } from '../scenes/testScene';

export type EntityTypeFromQuery<TB extends Bucket<any> = Bucket<any>> =
  TB extends Bucket<infer T> ? T : never;

export type ISystemFactory = (world: World) => {
  update?: (deltaTime: number) => void;
};

type Item = {
  num: number;
  group: number;
  lvl: number;
  isExcellent: boolean;
};

export type Entity = Partial<{
  netId: number;
  modelId: number;
  worldIndex: ENUM_WORLD;
  modelFilePath: string;
  npcType: number;
  localPlayer: true;
  transform: {
    pos: IVector3Like;
    rot: IVector3Like;
    scale: number;
    posOffset?: IVector3Like;
  };
  modelObject: ModelObject;
  modelFactory: typeof ModelObject;
  objOutOfScope: true;
  pathfinding: {
    from: IVector2Like;
    to: IVector2Like;
    path: IVector2Like[] | null;
    calculated: boolean;
  };
  playerMoveTo: {
    point: IVector2Like;
    handled: boolean;
    sendToServer?: boolean;
  };
  movement: {
    velocity: IVector2Like;
  };
  playerAnimation: {
    action: PlayerAction;
  };
  monsterAnimation: {
    action: MonsterActionType;
  };
  attributeSystem: MUAttributeSystem;
  visibility: {
    state: 'visible' | 'nearby' | 'hidden';
    lastChecked: number;
  };
  screenPosition: {
    x: number;
    y: number;
    worldOffsetZ: number;
  };
  objectNameInWorld: string;
  charAppearance: {
    helm: Item | null;
    armor: Item | null;
    pants: Item | null;
    gloves: Item | null;
    boots: Item | null;
    leftHand: Item | null;
    rightHand: Item | null;
    wings: Item | null;
    charClass: CharacterClassNumber;
    changed: boolean;
  };
  highlighted: {
    color: Color3;
    layer: HighlightLayer | null;
  };
  interactable: true;
}>;

export class World extends ECSWorld<Entity> {
  readonly terrainScale = 100;

  viewport = new Viewport(0, 0, 1, 1);

  readonly gameTime = { TotalGameTime: { TotalSeconds: 0.1 } };

  readonly mapParent: TransformNode;

  readonly netObjsQuery = this.with('netId', 'transform');

  readonly playersQuery = this.with(
    'attributeSystem',
    'transform',
    'playerAnimation',
    'playerMoveTo',
    'pathfinding'
  );

  #localPlayerQuery = this.playersQuery.with('localPlayer');

  get playerEntity() {
    return this.#localPlayerQuery.entities[0];
  }

  terrain: {
    mesh: Mesh;
    index: ENUM_WORLD;
    MapTileObjects: (typeof ModelObject)[];
  } | null = null;

  readonly pathfinder = createPathfinding({
    width: 256,
    height: 256,
  });

  readonly assetsManager: AssetsManager;

  currentPointerTarget: Entity | null = null;

  constructor(readonly scene: TestScene) {
    super();

    this.assetsManager = new AssetsManager(this.scene);
    this.assetsManager.useDefaultLoadingScreen = false;

    this.mapParent = new TransformNode('mapParent', scene);
  }

  getTerrainHeight(x: number, y: number): number {
    return -9999;
  }

  isWalkable(x: number, y: number): boolean {
    return true;
  }

  getTerrainFlag(x: number, y: number): number {
    return 0;
  }
}
