import { World as ECSWorld } from 'miniplex';
import type {
  IVector2Like,
  IVector3Like,
} from '@babylonjs/core/Maths/math.like';
import type { ModelObject } from '../../common/modelObject';
import type { Scene } from '@babylonjs/core/scene';
import type {
  MonsterActionType,
  PlayerAction,
} from '../../common/objects/enum';
import type { MUAttributeSystem } from '../libs/attributeSystem';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CustomGroundMesh } from '../libs/mu/customGroundMesh';

export type ISystemFactory = (world: World) => {
  update?: (deltaTime: number) => void;
};

export type Entity = Partial<{
  netId: number;
  modelId: number;
  npcType: number;
  localPlayer: true;
  transform: {
    pos: IVector3Like;
    rot: IVector3Like;
    scale: number;
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
}>;

export class World extends ECSWorld<Entity> {
  readonly terrainScale = 100;

  readonly gameTime = { TotalGameTime: { TotalSeconds: 0.1 } };

  readonly mapParent: TransformNode;

  readonly netObjsQuery = this.with('netId', 'transform');

  readonly playersQuery = this.with(
    'attributeSystem',
    'transform',
    'modelId',
    'playerAnimation',
    'playerMoveTo',
    'pathfinding'
  );

  #localPlayerQuery = this.playersQuery.with('localPlayer');

  get playerEntity() {
    return this.#localPlayerQuery.entities[0];
  }

  terrain: CustomGroundMesh | null = null;

  constructor(readonly scene: Scene) {
    super();

    this.mapParent = new TransformNode('mapParent', scene);
    this.mapParent.scaling.setAll(1 / this.terrainScale);
    this.mapParent.scaling.y *= -1;
    this.mapParent.position.y = 256;
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
