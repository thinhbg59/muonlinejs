import { Document, Node, NodeIO } from '@gltf-transform/core';
import { BMD, BMDReader, BMDTextureBone } from '../common/BMD';
import { Glob } from 'bun';
import { EXTTextureWebP } from '@gltf-transform/extensions';
import sharp from 'sharp';
import {decodeTga} from '@lunapaint/tga-codec';
import { PNG } from 'pngjs';

async function tga2png(file: Buffer) {
  const tga = await decodeTga(new Uint8Array(file));
  const png = new PNG({
    width: tga.details.header.width,
    height: tga.details.header.height,
  });
  png.data = tga.image.data;

  return new Promise<Buffer>((resolve, reject) => {
    const bufs: Uint8Array[] = [];
    png
      .pack()
      .on('data', d => {
        bufs.push(d);
      })
      .on('end', () => {
        const buffer = Buffer.concat(bufs);

        resolve(buffer);
      })
      .on('error', reject);
  });
}

async function convertImageToWebP(image: Uint8Array): Promise<Uint8Array> {
  if (image.length > 0 && image[0] === 0x00 && image[1] === 0x00) {
    const inputBuffer = Buffer.from(image);
    const outputBuffer = await tga2png(inputBuffer);
    image = new Uint8Array(outputBuffer);
  }

  const buffer = await sharp(image).toFormat('webp').toBuffer();

  return new Uint8Array(buffer);
}

const BMD_EXT = '.bmd';

const DATA_FOLDER = __dirname + `/../public/data/`;

const glob = new Glob(
  `**/*{${BMD_EXT.toUpperCase()},${BMD_EXT.toLowerCase()}}`
);

// === Конвертация системы координат BMD → glTF ===
const convertVec3 = (v: { x: number; y: number; z: number }) => v;
//  ({
//   x: -v.y, //  -Y  →  +X (но так как в glTF «право» = -X, разворачиваем знак)
//   y: v.z, //  +Z  →  +Y
//   z: v.x, //  +X  →  +Z
// });

// Простейшие операции с кватернионами — без сторонних зависимостей

type Quaternion = { x: number; y: number; z: number; w: number };

// Умножение кватернионов (a * b)
function quatMultiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

function quatInvert(q: Quaternion): Quaternion {
  // Для единичного кватерниона инверсия = сопряжение
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

// Кватернион, поворачивающий базис BMD в базис glTF
const TRANSFORM_Q: Quaternion = { x: 0.5, y: -0.5, z: 0.5, w: -0.5 };
const TRANSFORM_Q_INV: Quaternion = quatInvert(TRANSFORM_Q);

function convertQuaternion(q: Quaternion): Quaternion {
  return q;
  // const tmp = quatMultiply(TRANSFORM_Q, q);
  // const res = quatMultiply(tmp, TRANSFORM_Q_INV);
  // return res;
}

async function convertBMDToGLTF(bmd: BMD, outputFilename: string) {
  const fileName = outputFilename.split('/').at(-1)!.split('.')[0];

  const doc = new Document();
  // Create an Extension attached to the Document.
  const webpExtension = doc
    .createExtension(EXTTextureWebP as any)
    .setRequired(true);

  const buffer = doc.createBuffer();
  const scene = doc.createScene('mainScene');

  const modelRoot = doc.createNode(`model_${fileName}`);
  scene.addChild(modelRoot);

  const skinNodes: Node[] = [];

  const skinRoot = doc.createNode(`skin_${fileName}`);
  const skin = doc.createSkin();
  skin.setSkeleton(skinRoot);
  skin.addJoint(skinRoot);

  scene.addChild(skinRoot);

  let boneIndex = 0;
  for (const bmdBone of bmd.Bones) {
    const node = doc.createNode(`bone_${boneIndex}_${bmdBone.Name}`);
    skin.addJoint(node);

    skinNodes.push(node);

    if (bmdBone.Parent === -1) {
      skinRoot.addChild(node);
    } else {
      const parentNode = skinNodes[bmdBone.Parent];
      parentNode.addChild(node);
    }

    boneIndex++;
  }

  // === КОНВЕРТАЦИЯ АНИМАЦИЙ ===
  const DEFAULT_FPS = 24;
  for (let actionIndex = 0; actionIndex < bmd.Actions.length; actionIndex++) {
    const action = bmd.Actions[actionIndex];

    if (action.NumAnimationKeys === 0) continue;

    const animation = doc.createAnimation(`action_${actionIndex}`);

    // Общий accessor времени для всех костей
    const times: number[] = [];
    const dt =
      1 /
      (action.PlaySpeed && action.PlaySpeed > 0
        ? action.PlaySpeed * DEFAULT_FPS
        : DEFAULT_FPS);
    for (let k = 0; k < action.NumAnimationKeys; k++) {
      times.push(k * dt);
    }
    const inputAccessor = doc
      .createAccessor(`anim_${actionIndex}_input`)
      .setType('SCALAR')
      .setArray(new Float32Array(times))
      .setBuffer(buffer);

    const lockPositions = action.LockPositions;

    // Проходим по всем костям и создаём каналы
    for (let boneIndex = 0; boneIndex < bmd.Bones.length; boneIndex++) {
      const bone = bmd.Bones[boneIndex];
      if (bone === BMDTextureBone.Dummy) continue;

      const boneMatrix = bone.Matrixes[actionIndex];

      // === Translation ===
      if (
        boneMatrix.Position &&
        boneMatrix.Position.length === action.NumAnimationKeys
      ) {
        const posArray: number[] = [];
        boneMatrix.Position.forEach(p => {
          const cp = convertVec3(p);
          posArray.push(cp.x, cp.y, cp.z);
        });

        if (boneIndex === 0 && lockPositions && posArray.length > 0) {
          for (let i = 3; i < posArray.length; i += 3) {
            posArray[i + 0] = posArray[0];
            posArray[i + 1] = posArray[1];
          }
        }
        const posAccessor = doc
          .createAccessor(`anim_${actionIndex}_bone_${boneIndex}_T`)
          .setType('VEC3')
          .setArray(new Float32Array(posArray))
          .setBuffer(buffer);

        const sampler = doc
          .createAnimationSampler()
          .setInput(inputAccessor)
          .setOutput(posAccessor)
          .setInterpolation('LINEAR');

        const channel = doc
          .createAnimationChannel()
          .setTargetNode(skinNodes[boneIndex])
          .setTargetPath('translation')
          .setSampler(sampler);

        animation.addSampler(sampler).addChannel(channel);
      }

      // === Rotation ===
      if (
        boneMatrix.Quaternion &&
        boneMatrix.Quaternion.length === action.NumAnimationKeys
      ) {
        const rotArray: number[] = [];
        boneMatrix.Quaternion.forEach(q => {
          const cq = convertQuaternion(q);
          rotArray.push(cq.x, cq.y, cq.z, cq.w);
        });
        const rotAccessor = doc
          .createAccessor(`anim_${actionIndex}_bone_${boneIndex}_R`)
          .setType('VEC4')
          .setArray(new Float32Array(rotArray))
          .setBuffer(buffer);

        const samplerR = doc
          .createAnimationSampler()
          .setInput(inputAccessor)
          .setOutput(rotAccessor)
          .setInterpolation('LINEAR');

        const channelR = doc
          .createAnimationChannel()
          .setTargetNode(skinNodes[boneIndex])
          .setTargetPath('rotation')
          .setSampler(samplerR);

        animation.addSampler(samplerR).addChannel(channelR);
      }
    }
  }

  // Обрабатываем каждый меш
  let meshIndex = 0;
  for (const bmdMesh of bmd.Meshes) {
    const node = doc.createNode(`node_${meshIndex}`);
    meshIndex++;
    node.setTranslation([0, 0, 0]);
    node.setRotation([0, 0, 0, 1]);
    node.setScale([1, 1, 1]);
    modelRoot.addChild(node);

    node.setSkin(skin);

    const positionArray: number[] = []; //vec3
    const indicesArray: number[] = []; //float
    const texcoordArray: number[] = []; //vec2
    const normalsArray: number[] = []; //vec3
    const colorsArray: number[] = []; //vec4
    const boneIndexArray: number[] = [];
    const weightsArray: number[] = [];

    let pi = 0;

    const mesh = doc.createMesh(`mesh_${meshIndex}`);
    node.setMesh(mesh);

    for (let i = 0; i < bmdMesh.Triangles.length; i++) {
      const triangle = bmdMesh.Triangles[i];

      if (triangle.Polygon !== 3) throw new Error('Triangle is not a triangle');

      for (let j = 0; j < triangle.Polygon; j++) {
        const vertexIndex = triangle.VertexIndex[j];
        const vertex = bmdMesh.Vertices[vertexIndex];

        const normalIndex = triangle.NormalIndex[j];
        const normal = bmdMesh.Normals[normalIndex].Normal;
        const coordIndex = triangle.TexCoordIndex[j];
        const texCoord = bmdMesh.TexCoords[coordIndex];

        const pos = vertex.Position;
        const convPos = convertVec3(pos);

        positionArray.push(convPos.x, convPos.y, convPos.z);
        const convNormal = convertVec3(normal);
        normalsArray.push(convNormal.x, convNormal.y, convNormal.z);
        texcoordArray.push(texCoord.U, texCoord.V);
        colorsArray.push(1, 1, 1, 1);
        boneIndexArray.push(vertex.Node + 1, 0, 0, 0);
        weightsArray.push(1, 0, 0, 0);
      }

      const vInd0 = pi++;
      const vInd1 = pi++;
      const vInd2 = pi++;

      // for bmd
      indicesArray.push(vInd0);
      indicesArray.push(vInd1);
      indicesArray.push(vInd2);

      // for GLTF, counter-clockwise
      // indicesArray.push(vInd0);
      // indicesArray.push(vInd2);
      // indicesArray.push(vInd1);
    }

    const indices = doc
      .createAccessor()
      .setArray(new Uint16Array(indicesArray))
      .setType('SCALAR')
      .setBuffer(buffer);
    const position = doc
      .createAccessor()
      .setArray(new Float32Array(positionArray))
      .setType('VEC3')
      .setBuffer(buffer);
    const texcoord = doc
      .createAccessor()
      .setArray(new Float32Array(texcoordArray))
      .setType('VEC2')
      .setBuffer(buffer);
    const normal = doc
      .createAccessor()
      .setArray(new Float32Array(normalsArray))
      .setType('VEC3')
      .setBuffer(buffer);
    const color = doc
      .createAccessor()
      .setArray(new Float32Array(colorsArray))
      .setType('VEC4')
      .setBuffer(buffer);
    const boneIndex = doc
      .createAccessor()
      .setArray(new Uint8Array(boneIndexArray))
      .setType('VEC4')
      .setBuffer(buffer);
    const weights = doc
      .createAccessor()
      .setArray(new Float32Array(weightsArray))
      .setType('VEC4')
      .setBuffer(buffer);

    const isTransparent = bmdMesh.TexturePath.endsWith('.tga');
    const texPath = bmd.Dir + bmdMesh.TexturePath;
    const texture = doc.createTexture(
      texPath.split('/').slice(-2).join('/').split('.')[0] + '.webp'
    );
    let texSuccess = false;
    try {
      const bytes = await Bun.file(texPath).bytes();
      texture.setImage(await convertImageToWebP(bytes));
      texture.setMimeType(`image/webp`);
      texSuccess = true;
    } catch (e) {
      console.error(`Error converting ${texPath} to webp:`, e);
    }

    // material
    const material = doc
      .createMaterial()
      .setRoughnessFactor(1)
      .setMetallicFactor(0);

    material.setAlphaMode(isTransparent ? 'BLEND' : 'OPAQUE');

    if (texSuccess) {
      material.setBaseColorTexture(texture);
    }

    // primitive and mesh
    const prim = doc
      .createPrimitive()
      .setMaterial(material)
      .setIndices(indices)
      .setAttribute('POSITION', position)
      .setAttribute('TEXCOORD_0', texcoord)
      .setAttribute('NORMAL', normal)
      .setAttribute('COLOR_0', color)
      .setAttribute('JOINTS_0', boneIndex)
      .setAttribute('WEIGHTS_0', weights);

    mesh.addPrimitive(prim);
  }

  const io = new NodeIO();
  io.registerExtensions([EXTTextureWebP]);
  await io.write(outputFilename, doc);
}

const reader = new BMDReader();

let counter = 0;
for (const relFilePath of glob.scanSync(DATA_FOLDER)) {
  const fileName = relFilePath.split('/').at(-1)!;

  const absFilePath = DATA_FOLDER + relFilePath;
  const folder = absFilePath.replace(fileName, '');

  const buffer = await Bun.file(absFilePath).bytes();

  try {
    const bmd = reader.read(buffer, folder);

    const outputFilename = `${folder}${fileName.replace(BMD_EXT, '.glb')}`;

    await convertBMDToGLTF(bmd, outputFilename);
  } catch (e) {
    console.error(`Ошибка при конвертации ${absFilePath}:`, e);
    // console.log(bmd);
    continue;
  }

  // console.log(`GLTF файл сохранен как: ${outputFilename}`);

  counter++;
}

console.log(`Processed ${counter} files!`);

// const folder = DATA_FOLDER + 'Object1/';
// const absFilePath = folder + 'HouseEtc03.bmd';

// const buffer = await Bun.file(absFilePath).bytes();

// try {
//   const bmd = reader.read(buffer, folder);

//   const outputFilename = `${folder}HouseEtc03.glb`;

//   await convertBMDToGLTF(bmd, outputFilename);
// } catch (e) {
//   console.error(`Ошибка при конвертации ${absFilePath}:`, e);
// }
