import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { BMD, BMDTextureBone } from './BMD';
import {
  BoundingBox,
  Mesh,
  type StandardMaterial,
  TransformNode,
  type Scene,
} from '@babylonjs/core';
import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { createMeshesForBMD } from './BMD/createMeshes';
import type { Entity, World } from '../src/ecs/world';
import { ENUM_WORLD } from './types';
import { loadBMD } from './modelLoader';

const MAX_BONES = 64;
const BoundingUpdateInterval = 5;

type Int = number;

const EmptyBone = Matrix.Identity();
const EmptyMatrix = Matrix.Identity();
const tmpMatrix = Matrix.Identity();
const tmpQ = Quaternion.Identity();
const tmpVec3 = Vector3.Zero();

export class ModelObject {
  static OverrideScale = -1;

  Type: number = -1;
  WorldIndex: ENUM_WORLD = ENUM_WORLD.WD_0LORENCIA;

  HiddenMesh = -1;
  BlendMesh = -1;
  // BlendMeshState  = BlendState.Additive;
  AnimationSpeed = 4.0;
  BoneTransform: Matrix[] = [];
  BodyHeight: Float = 0;
  CurrentAction: Int = 0;
  LoopAction = true;
  LinkParent = false;
  ActionIterationWasFinished = false;
  Ready = false;
  OutOfView = false;
  Visible = true;
  Parent?: ModelObject;
  Children: ModelObject[] = [];

  #actionStartAt = 0;
  #nextFrame = -1;

  get objectDir() {
    return `Object${this.WorldIndex + 1}/`;
  }

  _invalidatedBuffers = true;
  _meshesBonesData: Float32Array[] = [];
  private _priorAction: Int = 0;
  Light = new Vector3(0, 0, 0);

  ParentBoneLink = -1;

  get ParentBodyOrigin(): Matrix {
    const bt = this.Parent?.BoneTransform;
    return this.ParentBoneLink >= 0 &&
      bt != null &&
      this.ParentBoneLink < bt.length
      ? bt[this.ParentBoneLink]
      : EmptyMatrix;
  }

  private _node: TransformNode;
  private _meshes: Mesh[] = [];

  NodeNamePrefix = '';

  get Model() {
    return this.bmd;
  }

  private bmd: BMD | null = null;

  constructor(private readonly scene: Scene, parent?: TransformNode) {
    this._node = new TransformNode('modelObject', this.scene);
    this._node.rotationQuaternion = null;

    if (parent) {
      this._node.setParent(parent);
    }
  }

  init(_world: World, _entity: Entity): Promise<void> {
    return Promise.resolve();
  }

  load(bmd: BMD) {
    const oldBMD = this.bmd;
    this.bmd = bmd;
    this._node.name = this.NodeNamePrefix + bmd.Name;

    if (oldBMD && oldBMD !== bmd) {
      this._meshes.forEach(m => {
        m.dispose();
      });
    }

    this._meshes = createMeshesForBMD(this.scene, bmd, this._node);

    this.BoneTransform = new Array(bmd.Bones.length).fill(null);
    this.BoneTransform.forEach((_, i) => {
      this.BoneTransform[i] = Matrix.Identity();
    });

    // this._meshesVertexData = new Array(bmd.Meshes.length).fill(null);
    this._meshesBonesData = new Array(bmd.Meshes.length)
      .fill(null)
      .map(i => new Float32Array(MAX_BONES * 16));

    this.#generateBoneMatrix(0, 0, 0, 0);

    this.Ready = true;
  }

  setParent(parent: ModelObject): void {
    if (this.Parent) {
      // Remove from previous parent's children
      const index = this.Parent.Children.indexOf(this);
      if (index !== -1) {
        this.Parent.Children.splice(index, 1);
      }
    }

    this.Parent = parent;
    parent.Children.push(this);
  }

  getMesh(ind: number) {
    return this._meshes[ind];
  }

  getMaterial(ind: number) {
    return this._meshes[ind].material as StandardMaterial;
  }

  setActionSpeed(actionType: number, speed: number) {
    const action = this.Model?.Actions[actionType];
    if (action) {
      action.PlaySpeed = speed;
    }
  }

  Update(gameTime: World['gameTime']): void {
    // base.Update(gameTime);

    if (!this.Ready || this.OutOfView) return;

    // if (_effect != null)
    // {
    //     if (_effect is IEffectMatrices effectMatrices)
    //     {
    //         effectMatrices.View = Camera.Instance.View;
    //         effectMatrices.Projection = Camera.Instance.Projection;
    //     }
    //     else
    //     {
    //         _effect.Parameters["View"]?.SetValue(Camera.Instance.View);
    //         _effect.Parameters["Projection"]?.SetValue(Camera.Instance.Projection);
    //     }
    // }

    this.ActionIterationWasFinished = false;
    this.#RunAnimation(gameTime);
    this.#SetDynamicBuffers();

    if (this.Parent && this.ParentBoneLink >= 0) {
      const m = this.ParentBodyOrigin;
      m.decomposeToTransformNode(this._node);
      // this._node.position.scaleInPlace(0.01);
      // this._node.addRotation(0, Math.PI, 0);
      // this._node.scaling.set(1, 1, 1);
    }
  }

  Draw(gameTime: World['gameTime']): void {
    if (!this.Visible) return;
    // GraphicsDevice.DepthStencilState = DepthStencilState.Default;
    this.#DrawModel(false);
    // base.Draw(gameTime);
  }

  #DrawModel(isAfterDraw: boolean): void {
    if (!this.Model) return;

    const meshCount = this.Model.Meshes.length; // Cache mesh count

    for (let i = 0; i < meshCount; i++) {
      // if (this._dataTextures[i] == null) continue;
      // bool isRGBA = _dataTextures[i].Components === 4;
      // const isBlendMesh = this.BlendMesh == i;
      // bool draw = isAfterDraw
      //     ? isRGBA || isBlendMesh
      //     : !isRGBA && !isBlendMesh;

      // if (!isAfterDraw && RenderShadow)
      // {
      //     GraphicsDevice.DepthStencilState = MuGame.Instance.DisableDepthMask;
      //     DrawShadowMesh(i);
      // }

      // if (!draw) continue;

      // GraphicsDevice.DepthStencilState = isAfterDraw
      //     ? MuGame.Instance.DisableDepthMask
      //     : DepthStencilState.Default;

      this.DrawMesh(i);
    }
  }

  DrawMesh(mesh: Int): void {
    if (this.HiddenMesh === mesh) return;

    // const texture = this._boneTextures[mesh];
    // const vertexBuffer: VertexBuffer = this._boneVertexBuffers[mesh];
    // const indexBuffer: IndexBuffer = this._boneIndexBuffers[mesh];
    // const primitiveCount = indexBuffer.IndexCount / 3;

    // const vertexData = this._meshesVertexData[mesh];

    // if (vertexData == null) return;

    // const primitiveCount = vertexData.indices!.length / 3;

    // this._effect.Parameters["Texture"]?.SetValue(texture);

    // GraphicsDevice.BlendState = BlendMesh == mesh ? BlendMeshState : BlendState;
    // if (_effect is AlphaTestEffect alphaTestEffect)
    //     alphaTestEffect.Alpha = TotalAlpha;

    // foreach (EffectPass pass in _effect.CurrentTechnique.Passes)
    // {
    //     pass.Apply();

    //     GraphicsDevice.SetVertexBuffer(vertexBuffer);
    //     GraphicsDevice.Indices = indexBuffer;
    //     GraphicsDevice.DrawIndexedPrimitives(PrimitiveType.TriangleList, 0, 0, primitiveCount);
    // }

    // vertexData.applyToMesh(this._meshes[mesh], true);
    // vertexData.updateMesh(this._meshes[mesh]);
    this._meshes[mesh].metadata.array = this._meshesBonesData[mesh];
  }

  // DrawShadowMesh( mesh:Int):void{
  //     if (HiddenMesh === mesh || _boneVertexBuffers == null)
  //         return;

  //     Texture2D texture = _boneTextures[mesh];
  //     VertexBuffer vertexBuffer = _boneVertexBuffers[mesh];
  //     IndexBuffer indexBuffer = _boneIndexBuffers[mesh];
  //     int primitiveCount = indexBuffer.IndexCount / 3;

  //     _effect.Parameters["Texture"]?.SetValue(texture);

  //     VertexPositionColorNormalTexture[] shadowVertices = new VertexPositionColorNormalTexture[vertexBuffer.VertexCount];

  //     // Ensure alpha blending is enabled
  //     GraphicsDevice.BlendState = BlendState.AlphaBlend;

  //     if (_effect is AlphaTestEffect effect)
  //     {
  //         vertexBuffer.GetData(shadowVertices);

  //         // Clamp ShadowOpacity to a valid range (0 to 1)
  //         float clampedShadowOpacity = MathHelper.Clamp(ShadowOpacity, 0f, 1f);

  //         // Ensure that ShadowOpacity is being applied to each vertex color
  //         for (int i = 0; i < shadowVertices.Length; i++)
  //         {
  //             // Apply shadow opacity to the alpha channel, ensuring the value is between 0 and 255
  //             byte shadowAlpha = (byte)(255 * clampedShadowOpacity);
  //             shadowVertices[i].Color = new Color((byte)0, (byte)0, (byte)0, shadowAlpha);  // Apply shadow with calculated alpha
  //         }

  //         Matrix originalWorld = effect.World;
  //         Matrix originalView = effect.View;
  //         Matrix originalProjection = effect.Projection;

  //         // Get the model's rotation from the original world matrix
  //         Vector3 scale, translation;
  //         Quaternion rotation;
  //         originalWorld.Decompose(out scale, out rotation, out translation);

  //         // Create a world matrix for the shadow with the model's rotation
  //         Matrix world = Matrix.CreateFromQuaternion(rotation) *
  //                        Matrix.CreateRotationX(MathHelper.ToRadians(-20)) *
  //                        Matrix.CreateScale(0.8f, 1.0f, 0.8f) *
  //                        Matrix.CreateTranslation(translation);

  //         // Add light and shadow offset
  //         Vector3 lightDirection = new Vector3(-1, 0, 1);
  //         Vector3 shadowOffset = new Vector3(0.05f, 0, 0.1f);
  //         world.Translation += lightDirection * 0.3f + shadowOffset;

  //         effect.World = world;

  //         foreach (EffectPass pass in effect.CurrentTechnique.Passes)
  //         {
  //             pass.Apply();
  //             GraphicsDevice.DrawUserPrimitives(PrimitiveType.TriangleList, shadowVertices, 0, primitiveCount);
  //         }

  //         // Restore original matrices
  //         effect.World = originalWorld;
  //         effect.View = originalView;
  //         effect.Projection = originalProjection;
  //     }
  // }

  // #DrawAfter(gameTime: World['gameTime']): void {
  //   if (!this.Visible) return;
  //   this.#DrawModel(true);
  //   // base.DrawAfter(gameTime);
  // }

  #RunAnimation(gameTime: World['gameTime']): void {
    if (!this.Model) return;

    if (this.LinkParent || this.Model.Actions.length < 1) return;

    const currentActionData = this.Model.Actions[this.CurrentAction];

    if (!currentActionData) {
      console.warn(
        `Current action ${this.CurrentAction} not found in model actions.`
      );
      return;
    }

    if (currentActionData.NumAnimationKeys <= 1) {
      if (this._priorAction !== this.CurrentAction) {
        this.#generateBoneMatrix(this.CurrentAction, 0, 0, 0);
        this._priorAction = this.CurrentAction;
        this.ActionIterationWasFinished = true;
      }
      return;
    }

    if (this._priorAction !== this.CurrentAction) {
      this.#actionStartAt = gameTime.TotalGameTime.TotalSeconds;
      this.#nextFrame = -1;
    }

    const t = gameTime.TotalGameTime.TotalSeconds - this.#actionStartAt;

    let currentFrame = t * this.AnimationSpeed * currentActionData.PlaySpeed;
    const totalFrames = currentActionData.NumAnimationKeys - 1;
    currentFrame %= totalFrames;

    this.#Animation(currentFrame);

    this._priorAction = this.CurrentAction;
  }

  #Animation(currentFrame: Float): void {
    if (this.LinkParent || this.Model == null || this.Model.Actions.length < 1)
      return;

    if (this.CurrentAction >= this.Model.Actions.length) {
      this.CurrentAction = 0;
    }

    const currentAnimationFrame: Int = ~~Math.floor(currentFrame);
    const interpolationFactor = currentFrame - currentAnimationFrame;

    const currentActionData = this.Model.Actions[this.CurrentAction];
    const totalFrames = currentActionData.NumAnimationKeys - 1;
    const nextAnimationFrame = (currentAnimationFrame + 1) % totalFrames;

    if (nextAnimationFrame >= this.#nextFrame) {
      this.#nextFrame = nextAnimationFrame;
    } else if (this.#nextFrame !== -1) {
      this.#nextFrame = -1; // Reset next frame if it has not changed
      this.ActionIterationWasFinished = true;
    }

    if (nextAnimationFrame < currentAnimationFrame) {
      if (!this.LoopAction) return;
    }

    this.#generateBoneMatrix(
      this.CurrentAction,
      currentAnimationFrame,
      nextAnimationFrame,
      interpolationFactor
    );
  }

  #generateBoneMatrix(
    currentAction: Int,
    currentAnimationFrame: Int,
    nextAnimationFrame: Int,
    interpolationFactor: Float
  ): void {
    if (!this.Model) return;

    const currentActionData = this.Model.Actions[currentAction];
    let changed = false;

    const boneTransforms = this.BoneTransform; // Cache BoneTransform
    const modelBones = this.Model.Bones; // Cache Model.Bones
    const lockPositions = currentActionData.LockPositions;

    for (let i = 0; i < modelBones.length; i++) {
      const bone = modelBones[i];

      if (bone === BMDTextureBone.Dummy) continue;

      const bm = bone.Matrixes[currentAction];

      const q1 = bm.Quaternion[currentAnimationFrame];
      const q2 = bm.Quaternion[nextAnimationFrame];

      const boneQuaternion = Quaternion.SlerpToRef(
        q1,
        q2,
        interpolationFactor,
        tmpQ
      );
      tmpMatrix.copyFrom(Matrix.IdentityReadOnly);
      let matrix = tmpMatrix;

      Matrix.FromQuaternionToRef(boneQuaternion, matrix);

      const position1 = bm.Position[currentAnimationFrame];
      const position2 = bm.Position[nextAnimationFrame];
      const interpolatedPosition = Vector3.LerpToRef(
        position1,
        position2,
        interpolationFactor,
        tmpVec3
      );

      if (i === 0 && lockPositions) {
        interpolatedPosition.x = bm.Position[0].x;
        interpolatedPosition.y = bm.Position[0].y;
        // Z is UP in our implementation
        interpolatedPosition.z = interpolatedPosition.z + this.BodyHeight;
      }

      matrix.setTranslation(interpolatedPosition);

      if (bone.Parent !== -1) {
        const parentMatrix = boneTransforms[bone.Parent];
        matrix.multiplyToRef(parentMatrix, matrix); //TODO check it
      }

      if (!changed && !boneTransforms[i].equalsWithEpsilon(matrix))
        changed = true;

      boneTransforms[i].copyFrom(matrix);
    }

    if (changed) {
      this._invalidatedBuffers = true;

      for (const child of this.Children) {
        if (child.LinkParent) {
          child._invalidatedBuffers = true;
        }
      }
      // this.InvalidateBuffers();
      // this.UpdateBoundings();
    }
  }

  #SetDynamicBuffers(): void {
    if (!this._invalidatedBuffers || !this.Model) return;

    const meshCount = this.Model.Meshes.length; // Cache mesh count

    // this._boneVertexBuffers ??= new VertexBuffer[meshCount];
    // this._boneIndexBuffers ??= new IndexBuffer[meshCount];
    // this._boneTextures ??= new Texture2D[meshCount];
    // this._scriptTextures ??= new TextureScript[meshCount];
    // this._dataTextures ??= new TextureData[meshCount];

    for (let meshIndex = 0; meshIndex < meshCount; meshIndex++) {
      // const mesh = this.Model.Meshes[meshIndex];

      // Resolve the body light conflict
      // let bodyLight = Vector3.ZeroReadOnly;

      // if (this.LightEnabled && this.World.Terrain != null)
      // {
      //     Vector3 terrainLight = World.Terrain.RequestTerrainLight(WorldPosition.Translation.X, WorldPosition.Translation.Y);
      //     terrainLight += Light;
      //     bodyLight = terrainLight;
      // }
      // else
      // {
      // bodyLight = this.Light;
      // }

      // bodyLight = meshIndex == BlendMesh
      //     ? bodyLight * BlendMeshLight
      //     : bodyLight * TotalAlpha;

      // _boneVertexBuffers[meshIndex]?.Dispose();
      // _boneIndexBuffers[meshIndex]?.Dispose();

      // Matrix[] bones = (this.LinkParent && this.Parent is ModelObject parentModel) ? parentModel.BoneTransform : this.BoneTransform;
      const bones =
        this.LinkParent && this.Parent
          ? this.Parent.BoneTransform
          : this.BoneTransform;

      // Use the updated color calculation method from the improvements branch
      // byte r = Color.R;
      // byte g = Color.G;
      // byte b = Color.B;

      // Calculate color components considering lighting and clamping values
      // byte bodyR = (byte)Math.Min(r * bodyLight.X, 255);
      // byte bodyG = (byte)Math.Min(g * bodyLight.Y, 255);
      // byte bodyB = (byte)Math.Min(b * bodyLight.Z, 255);

      // Color bodyColor = new Color(bodyR, bodyG, bodyB);

      for (let b = 0; b < MAX_BONES; b++)
        for (let c = 0; c < 16; c++)
          this._meshesBonesData[meshIndex][b * 16 + c] = (
            bones[b] ?? EmptyBone
          ).m[c];

      // this._meshesVertexData[meshIndex] = newVertexData;
      // _boneVertexBuffers[meshIndex] = vertexBuffer;
      // _boneIndexBuffers[meshIndex] = indexBuffer;

      // if (_boneTextures[meshIndex] == null)
      // {
      //     string texturePath = BMDLoader.Instance.GetTexturePath(Model, mesh.TexturePath);
      //     _boneTextures[meshIndex] = TextureLoader.Instance.GetTexture2D(texturePath);
      //     _scriptTextures[meshIndex] = TextureLoader.Instance.GetScript(texturePath);
      //     _dataTextures[meshIndex] = TextureLoader.Instance.Get(texturePath);

      //     var script = _scriptTextures[meshIndex];

      //     if (script != null)
      //     {
      //         if (script.HiddenMesh)
      //             HiddenMesh = meshIndex;

      //         if (script.Bright)
      //             BlendMesh = meshIndex;
      //     }
      // }
    }

    this._invalidatedBuffers = false;
  }

  #boundingFrameCounter = 0;

  BoundingBoxLocal = new BoundingBox(Vector3.Zero(), Vector3.Zero());

  UpdateBoundings() {
    // Recalculate bounding box only every few frames
    // if (this.#boundingFrameCounter++ < BoundingUpdateInterval) return;

    this.#boundingFrameCounter = 0;

    if (
      !this.Model?.Meshes ||
      this.Model.Meshes.length === 0 ||
      this.BoneTransform.length === 0
    )
      return;

    const min = new Vector3(Number.MAX_VALUE);
    const max = new Vector3(Number.MIN_VALUE);

    let hasValidVertices = false;

    for (const mesh of this.Model.Meshes) {
      for (const vertex of mesh.Vertices) {
        const boneIndex = vertex.Node;
        if (boneIndex < 0 || boneIndex >= this.BoneTransform.length) continue;

        const transformedPosition = Vector3.TransformCoordinates(
          vertex.Position,
          this.BoneTransform[boneIndex]
        );

        // Optimized min/max calculation
        if (transformedPosition.x < min.x) min.x = transformedPosition.x;
        if (transformedPosition.y < min.y) min.y = transformedPosition.y;
        if (transformedPosition.z < min.z) min.z = transformedPosition.z;

        if (transformedPosition.x > max.x) max.x = transformedPosition.x;
        if (transformedPosition.y > max.z) max.y = transformedPosition.y;
        if (transformedPosition.z > max.z) max.z = transformedPosition.z;

        hasValidVertices = true;
      }
    }

    if (hasValidVertices) {
      this.BoundingBoxLocal = new BoundingBox(min, max);
    }
  }

  updateLocation(pos: IVector3Like, scale: Float, angles: IVector3Like) {
    this._node.position.set(pos.x, pos.y, pos.z);

    this._node.rotation.x = angles.x;
    this._node.rotation.y = angles.y;
    this._node.rotation.z = angles.z;

    this._node.scaling.setAll(scale);
  }

  Unload() {
    this._meshes.forEach(m => {
      m.dispose();
    });
    this._meshes.length = 0;

    this.Ready = false;
  }

  dispose(): void {
    this._node.dispose();
    this._meshes.forEach(m => {
      m.dispose();
    });

    this.Ready = false;

    for (const child of this.Children) {
      child.dispose();
    }

    this.Children.length = 0;
    this._meshes.length = 0;
  }

  protected async loadSpecificModel(modelName: string) {
    this.load(await loadBMD(`${this.objectDir}${modelName}`));
  }

  protected async loadSpecificModelWithDynamicID(
    modelId: number,
    namePrefix: string
  ) {
    const idx = (this.Type - modelId + 1).toString().padStart(2, '0');
    const name = `${namePrefix}${idx}.bmd`;
    await this.loadSpecificModel(name);
  }
}

// function TransformCoordinatesFromFloatsToRef<T extends Vector3>(
//   x: number,
//   y: number,
//   z: number,
//   transformation: Matrix,
//   result: T
// ): T {
//   const m = transformation.m;
//   const rx = x * m[0] + y * m[4] + z * m[8] + m[12];
//   const ry = x * m[1] + y * m[5] + z * m[9] + m[13];
//   const rz = x * m[2] + y * m[6] + z * m[10] + m[14];
//   //const rw = 1 / (x * m[3] + y * m[7] + z * m[11] + m[15]);

//   result.x = rx;
//   result.y = ry;
//   result.z = rz;
//   return result;
// }
