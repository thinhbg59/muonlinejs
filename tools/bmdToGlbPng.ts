import { Document, NodeIO } from '@gltf-transform/core';
import { BMD, BMDReader, BMDTextureBone } from '../src/common/BMD';
import { Glob } from 'bun';
import sharp from 'sharp';
import { decodeTga } from '@lunapaint/tga-codec';
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
    png.pack()
      .on('data', d => bufs.push(d))
      .on('end', () => resolve(Buffer.concat(bufs)))
      .on('error', reject);
  });
}

async function convertImageToPNG(image: Uint8Array): Promise<Uint8Array> {
  if (image.length > 0 && image[0] === 0x00 && image[1] === 0x00) {
    const inputBuffer = Buffer.from(image);
    const outputBuffer = await tga2png(inputBuffer);
    image = new Uint8Array(outputBuffer);
  }
  const buffer = await sharp(image).toFormat('png').toBuffer();
  return new Uint8Array(buffer);
}

// Settings
const BMD_EXT = '.bmd';
const PROJECT_ROOT = __dirname + `/../`;
const DATA_FOLDER = PROJECT_ROOT + `Data/`;
const OUTPUT_FOLDER = PROJECT_ROOT + `public/game-assets2/`;
const SCALE_MULTIPLIER = 0.01;

const convertVec3 = (v: { x: number; y: number; z: number }) => v;
type Quaternion = { x: number; y: number; z: number; w: number };
const convertQuaternion = (q: Quaternion) => q;

async function convertBMDToGLTF(bmd: BMD, outputFilename: string) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene('Scene');
  doc.setScene(scene);

  const skin = doc.createSkin();
  const skinNodes: any[] = [];

  const skinRoot = doc.createNode('root');
  skin.setSkeleton(skinRoot);
  skin.addJoint(skinRoot);
  scene.addChild(skinRoot);

  for (let i = 0; i < bmd.Bones.length; i++) {
    const bone = doc.createNode(`bone_${i}`);
    skinNodes.push(bone);
    skin.addJoint(bone);
    const parent = bmd.Bones[i].Parent;
    if (parent === -1) {
      skinRoot.addChild(bone);
    } else {
      skinNodes[parent].addChild(bone);
    }
  }

  // ANIMATION
  for (let actionIndex = 0; actionIndex < bmd.Actions.length; actionIndex++) {
    const action = bmd.Actions[actionIndex];
    if (action.NumAnimationKeys === 0) continue;
    const animation = doc.createAnimation(`action_${actionIndex}`);
    const times: number[] = [];
    const dt = 1 / ((action.PlaySpeed || 1) * 24);
    for (let i = 0; i < action.NumAnimationKeys; i++) times.push(i * dt);

    const input = doc.createAccessor()
      .setType('SCALAR')
      .setArray(new Float32Array(times))
      .setBuffer(buffer);

    for (let i = 0; i < bmd.Bones.length; i++) {
      const bone = bmd.Bones[i];
      if (bone === BMDTextureBone.Dummy) continue;
      const matrix = bone.Matrixes[actionIndex];

      if (matrix.Position?.length === action.NumAnimationKeys) {
        const positions: number[] = matrix.Position.flatMap(p => [
          p.x * SCALE_MULTIPLIER,
          p.y * SCALE_MULTIPLIER,
          p.z * SCALE_MULTIPLIER,
        ]);
        const output = doc.createAccessor()
          .setType('VEC3')
          .setArray(new Float32Array(positions))
          .setBuffer(buffer);
        const sampler = doc.createAnimationSampler()
          .setInput(input)
          .setOutput(output)
          .setInterpolation('LINEAR');
        animation.addChannel(
          doc.createAnimationChannel()
            .setTargetNode(skinNodes[i])
            .setTargetPath('translation')
            .setSampler(sampler)
        ).addSampler(sampler);
      }

      if (matrix.Quaternion?.length === action.NumAnimationKeys) {
        const quats: number[] = matrix.Quaternion.flatMap(q => [
          q.x, q.y, q.z, q.w
        ]);
        const output = doc.createAccessor()
          .setType('VEC4')
          .setArray(new Float32Array(quats))
          .setBuffer(buffer);
        const sampler = doc.createAnimationSampler()
          .setInput(input)
          .setOutput(output)
          .setInterpolation('LINEAR');
        animation.addChannel(
          doc.createAnimationChannel()
            .setTargetNode(skinNodes[i])
            .setTargetPath('rotation')
            .setSampler(sampler)
        ).addSampler(sampler);
      }
    }
  }

  // MESHES
  for (let m = 0; m < bmd.Meshes.length; m++) {
    const mesh = bmd.Meshes[m];
    const node = doc.createNode(`mesh_${m}`);
    scene.addChild(node);
    node.setSkin(skin);
    const gMesh = doc.createMesh();
    node.setMesh(gMesh);

    const pos: number[] = [], normal: number[] = [], uv: number[] = [],
      color: number[] = [], joints: number[] = [], weights: number[] = [], indices: number[] = [];
    let idx = 0;

    for (const tri of mesh.Triangles) {
      if (tri.Polygon !== 3) continue;
      for (let j = 0; j < 3; j++) {
        const vi = tri.VertexIndex[j];
        const ni = tri.NormalIndex[j];
        const ti = tri.TexCoordIndex[j];
        const v = mesh.Vertices[vi];
        const n = mesh.Normals[ni];
        const t = mesh.TexCoords[ti];

        pos.push(v.Position.x * SCALE_MULTIPLIER, v.Position.y * SCALE_MULTIPLIER, v.Position.z * SCALE_MULTIPLIER);
        normal.push(n.Normal.x, n.Normal.y, n.Normal.z);
        uv.push(t.U, t.V);
        color.push(1, 1, 1, 1);
        joints.push(v.Node + 1, 0, 0, 0);
        weights.push(1, 0, 0, 0);
        indices.push(idx++);
      }
    }

    const accessor = (array: number[] | Uint8Array | Uint16Array, type: any) =>
      doc.createAccessor().setArray(array instanceof Uint8Array || Uint16Array ? array : new Float32Array(array)).setType(type).setBuffer(buffer);

    const texPath = DATA_FOLDER + bmd.Dir + mesh.TexturePath;
    const texFile = mesh.TexturePath.split('.')[0] + '.png';
    const outTex = OUTPUT_FOLDER + bmd.Dir + texFile;

    let imageBytes: Uint8Array;
    try {
      const raw = await Bun.file(texPath).bytes();
      imageBytes = await convertImageToPNG(raw);
      await Bun.write(outTex, imageBytes, { createPath: true });
    } catch (e) {
      console.error(`Texture error: ${texPath}`, e);
      continue;
    }

    const texture = doc.createTexture(texFile)
      .setImage(imageBytes)
      .setMimeType('image/png')
      .setURI(`./game-assets/${bmd.Dir}${texFile}`);

    const material = doc.createMaterial()
      .setBaseColorTexture(texture)
      .setMetallicFactor(0)
      .setRoughnessFactor(1)
      .setAlphaMode('OPAQUE');

    const primitive = doc.createPrimitive()
      .setIndices(accessor(new Uint16Array(indices), 'SCALAR'))
      .setAttribute('POSITION', accessor(pos, 'VEC3'))
      .setAttribute('NORMAL', accessor(normal, 'VEC3'))
      .setAttribute('TEXCOORD_0', accessor(uv, 'VEC2'))
      .setAttribute('COLOR_0', accessor(color, 'VEC4'))
      .setAttribute('JOINTS_0', accessor(new Uint8Array(joints), 'VEC4'))
      .setAttribute('WEIGHTS_0', accessor(weights, 'VEC4'))
      .setMaterial(material);

    gMesh.addPrimitive(primitive);
  }

  const io = new NodeIO();
  await Bun.write(outputFilename, '', { createPath: true });
  await io.write(outputFilename, doc);
}

// MAIN
const reader = new BMDReader();
const glob = new Glob(`**/*{.BMD,.bmd}`);
let count = 0;

for (const relInputFilePath of glob.scanSync(DATA_FOLDER)) {
  const absInput = DATA_FOLDER + relInputFilePath;
  const outputGLB = OUTPUT_FOLDER + relInputFilePath.replace(/\\.bmd$/i, '.glb');

  const buffer = await Bun.file(absInput).bytes();
  try {
    const bmd = reader.read(buffer, relInputFilePath.replace(/[^/]+$/, ''));
    await convertBMDToGLTF(bmd, outputGLB);
    count++;
  } catch (e) {
    console.error(`Convert error: ${absInput}`, e);
  }
}

console.log(`✅ Converted ${count} BMD → GLB`);
