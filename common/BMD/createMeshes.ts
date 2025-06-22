import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { RawTexture, Texture } from '@babylonjs/core/Materials/Textures';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { Scene } from '@babylonjs/core/scene';
import { CustomMaterial } from '@babylonjs/materials/custom/customMaterial';
import { OpenTga } from '../textures/test';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { BMD } from '.';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { getEmptyTexture } from '../../src/libs/babylon/emptyTexture';

const MAX_BONES = 64;

function createCustomMaterial(scene: Scene, opts: { withTint?: boolean }) {
  const mat = new CustomMaterial('TexturesAtlasMaterial', scene);
  mat.fogEnabled = true;
  mat.backFaceCulling = false;
  mat.transparencyMode = 1;
  mat.useAlphaFromDiffuseTexture = true;
  mat.specularColor = Color3.Black();

  mat.AddAttribute(VertexBuffer.UV2Kind);
  mat.AddUniform(`bonesArray[${MAX_BONES}]`, 'mat4', undefined);

  mat.Vertex_After_WorldPosComputed(`
    float boneIndexFloat = uv2.x;
    int boneIndex = int(boneIndexFloat);
    finalWorld = world * bonesArray[boneIndex];
     worldPos = finalWorld*vec4(positionUpdated, 1.0);
     normalWorld = mat3(finalWorld);
    // vNormalW = normalize(normalWorld*normalUpdated);
    vNormalW = normalize(normalWorld*vec3(0.0,0.0,0.5));
  `);

  // let time = 0;
  scene.onReadyObservable.addOnce(() => {
    // scene.onBeforeRenderObservable.add(() => {
    //   time += scene.getEngine()!.getDeltaTime()! / 1000;
    // });

    mat.onBindObservable.add(ev => {
      const effect = mat.getEffect();
      if (!effect) return;
      // effect.setFloat('time', time);
      const array = ev.metadata?.array;
      if (!array || array.length === 0) return;
      effect.setMatrices('bonesArray', array);
    });
  });

  mat.unfreeze();

  return mat;
}

const materialCache: Record<string, StandardMaterial> = {};

function getMaterial(
  bmd: BMD,
  meshIndex: number,
  scene: Scene,
  mesh: BMD['Meshes'][number]
) {
  const uniqName = bmd.Name + '_mesh' + meshIndex;
  // const uniqName = '_mat_';

  if (materialCache[uniqName]) return materialCache[uniqName];

  const m = createCustomMaterial(scene, {});
  m.name = uniqName;
  m.backFaceCulling = false;
  m.diffuseTexture = getEmptyTexture(scene);
  m.emissiveTexture = getEmptyTexture(scene);

  const textureName = mesh.TexturePath;

  const textureFilePath = bmd.Dir + textureName;

  if (textureName.toLowerCase().endsWith('.tga')) {
    const t = new Texture(textureFilePath, scene, false, false);
    // t.hasAlpha = true;
    m.diffuseTexture = t;
    // m.transparencyMode = 2;
    // m.useAlphaFromDiffuseTexture = true;
  } else {
    const t = new Texture(textureFilePath, scene, false, false);
    m.diffuseTexture = t;
  }

  materialCache[uniqName] = m;

  return m;
}

export function createMeshesForBMD(
  scene: Scene,
  bmd: BMD,
  parent: TransformNode
) {
  return bmd.Meshes.map((mesh, meshIndex) => {
    const customMesh = new Mesh(bmd.Name + '_mesh' + meshIndex, scene);

    customMesh.isPickable = false;

    // customMesh.showBoundingBox = true;

    customMesh.setParent(parent);

    customMesh.scaling.setAll(1);

    customMesh.position.setAll(0);
    customMesh.rotationQuaternion = null;
    customMesh.rotation.setAll(0);
    customMesh.metadata = {
      array: [],
    };

    const positions: number[] = []; //vec3
    const indices: number[] = []; //float
    const uvs: number[] = []; //vec2
    const normals: number[] = []; //vec3
    const colors: number[] = []; //vec4
    const boneIndex: number[] = [];

    let pi = 0;

    for (let i = 0; i < mesh.Triangles.length; i++) {
      const triangle = mesh.Triangles[i];

      for (let j = 0; j < triangle.Polygon; j++) {
        const vertexIndex = triangle.VertexIndex[j];
        const vertex = mesh.Vertices[vertexIndex];

        const normalIndex = triangle.NormalIndex[j];
        const normal = mesh.Normals[normalIndex].Normal;
        const coordIndex = triangle.TexCoordIndex[j];
        const texCoord = mesh.TexCoords[coordIndex];

        const pos = vertex.Position;

        indices.push(pi);
        positions.push(pos.x, pos.y, pos.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(texCoord.U, texCoord.V);
        colors.push(1, 1, 1, 1);

        boneIndex.push(vertex.Node, 0);

        pi++;
      }
    }

    const vertexData = new VertexData();

    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    vertexData.uvs2 = boneIndex;
    vertexData.colors = colors;

    vertexData.applyToMesh(customMesh, false);

    customMesh.material = getMaterial(bmd, meshIndex, scene, mesh);

    return customMesh;
  });
}
