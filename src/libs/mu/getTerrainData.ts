import {
  CreatePlane,
  RawTexture,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from '../babylon/exports';
import { CreateGroundFromHeightMap } from './customGroundMesh';
import { createTerrainMaterial } from './terrainMaterial';
import { ENUM_WORLD } from '../../../common';
import {
  downloadBytesBuffer,
  isFlagInBinaryMask,
  readOJZBufferAsJPEGBuffer,
  toRadians,
} from '../../../common/utils';
import { parseTerrainAttribute } from '../../../common/terrain/parseTerrainAttribute';
import { parseTerrainHeight } from '../../../common/terrain/parseTerrainHeight';
import { parseTerrainMapping } from '../../../common/terrain/parseTerrainMapping';
import { parseTerrainLight } from '../../../common/terrain/parseTerrainLight';
import { getTilesList } from '../../../common/terrain/getTilesList';
import {
  SpecialHeight,
  TERRAIN_SIZE,
  TERRAIN_SIZE_MASK,
  TWFlags,
} from '../../../common/terrain/consts';
import { parseTerrainObjects } from '../../../common/terrain/parseTerrainObjects';
import { Store } from '../../store';

function createTexturesAtlasFromRects(
  scene: Scene,
  data: { map1: Uint8Array; map2: Uint8Array }
) {
  const count = data.map1.length;

  const rectsArray = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE * 4);
  data.map1.forEach((m1, i) => {
    const m2 = data.map2[i];

    rectsArray[i * 4 + 0] = m1;
    rectsArray[i * 4 + 1] = m2;
    rectsArray[i * 4 + 2] = 255;
    rectsArray[i * 4 + 3] = 255;
  });

  const size = Math.round(Math.sqrt(count));

  const rectsTexture = RawTexture.CreateRGBATexture(
    rectsArray,
    size,
    size,
    scene,
    false,
    false,
    Texture.NEAREST_NEAREST
  );
  rectsTexture.isBlocking = false;
  rectsTexture.name = '_AtlasTexture';
  rectsTexture.anisotropicFilteringLevel = 1;

  return rectsTexture;
}

function createAlphaMapTexture(
  scene: Scene,
  data: { alpha: Float32Array; lights: Vector3[] }
) {
  const count = data.alpha.length;

  const rectsArray = new Uint8Array(TERRAIN_SIZE * TERRAIN_SIZE * 4);
  data.alpha.forEach((a, i) => {
    const l = data.lights[i];
    rectsArray[i * 4 + 0] = a * 255;
    rectsArray[i * 4 + 1] = l.x * 255;
    rectsArray[i * 4 + 2] = l.y * 255;
    rectsArray[i * 4 + 3] = l.z * 255;
  });

  const size = Math.round(Math.sqrt(count));

  const rectsTexture = RawTexture.CreateRGBATexture(
    rectsArray,
    size,
    size,
    scene,
    false,
    false,
    Texture.LINEAR_LINEAR
  );
  rectsTexture.isBlocking = false;
  rectsTexture.name = '_AlphaMap';
  rectsTexture.anisotropicFilteringLevel = 1;

  return rectsTexture;
}

function GetTerrainIndex(x: number, y: number) {
  return ~~(~~y * TERRAIN_SIZE + ~~x);
}

export async function getTerrainData(scene: Scene, map: ENUM_WORLD) {
  const worldNum = map + 1;
  const worldFolder = `./data/World${worldNum}/`;

  const terrainAttributeBytes = await downloadBytesBuffer(
    `${worldFolder}EncTerrain${worldNum}.att`
  );
  const terrainHeightBytes = await downloadBytesBuffer(
    `${worldFolder}TerrainHeight.OZB`
  );
  const terrainMappingBytes = await downloadBytesBuffer(
    `${worldFolder}EncTerrain${worldNum}.map`
  );
  const terrainLightBytes = await downloadBytesBuffer(
    `${worldFolder}TerrainLight.OZJ`
  );

  const terrainHeight = await parseTerrainHeight(terrainHeightBytes);
  const terrainAttrs = await parseTerrainAttribute(terrainAttributeBytes, map);
  const terrainMapping = await parseTerrainMapping(terrainMappingBytes);

  const lightTextureData = await readOJZBufferAsJPEGBuffer(
    scene,
    `${worldFolder}TerrainLight.OZJ`,
    terrainLightBytes
  );

  const terrainLight = await parseTerrainLight(
    lightTextureData.BufferFloat,
    terrainHeight
  );

  const textures = await Promise.all(
    getTilesList(map).map(async t => {
      const filePath = `./data/World${worldNum}/${t}.OZJ`;
      const ozjBytes = await downloadBytesBuffer(filePath);

      return readOJZBufferAsJPEGBuffer(scene, filePath, ozjBytes);
    })
  );

  // const lightTexture = lightTextureData.Texture.clone();
  // const lightData = terrainLight.Lights;
  // console.log({ terrainAttrs, terrainMapping, terrainHeight });

  // const texturesBuffer = await downloadBuffer(`./data/World1_new/EncTerrain.map`);
  // const groundMap = MapUtils.parseGround([...texturesBuffer.values()]);

  const objsBuffer = await downloadBytesBuffer(
    `./data/World${worldNum}/EncTerrain${worldNum}.obj`
  );
  const objects = parseTerrainObjects(objsBuffer);

  // await CMapManager_Load(map);

  // console.log({  objects:objects.map(o=>{
  //   o.Name = ENUM_OBJECTS[o.id];
  //   return o;
  // }) });

  const terrain = CreateGroundFromHeightMap(
    '_world_' + worldNum,
    terrainHeight,
    { width: TERRAIN_SIZE, height: TERRAIN_SIZE, subdivisions: TERRAIN_SIZE },
    scene
  );
  terrain.isPickable = true;

  terrain.metadata = {
    terrain: true,
  };

  const texturesData = textures.map(texture => {
    const t = texture.Texture.clone();
    t.updateSamplingMode(Texture.LINEAR_LINEAR);
    t.anisotropicFilteringLevel = 1;

    const size = t.getSize().height;
    let scale = size;
    if (scale === TERRAIN_SIZE) {
      scale /= 4;
    }
    return { texture: t, scale };
  });
  // tm.diffuseTexture = texturesData[0].texture;

  terrain.material = createTerrainMaterial(
    scene,
    { name: 'TerrainMaterial' },
    {
      texturesData,
      atlas: createTexturesAtlasFromRects(scene, {
        map1: terrainMapping.layer1,
        map2: terrainMapping.layer2,
      }),
      alphaMap: createAlphaMapTexture(scene, {
        alpha: terrainMapping.alpha,
        lights: terrainLight,
      }),
    }
  );

  //TODO why?
  terrain.position.x -= 4.5;
  terrain.position.y = 256.5;
  terrain.rotationQuaternion = null;
  terrain.rotation.x = toRadians(90);

  if (Store.showTerrainAttributes) {
    const plane = CreatePlane('_terrainPlane', { size: 256 }, scene);
    plane.isPickable = false;
    plane.position.set(128 + 0.5, 128 - 0.5, 1.68);
    plane.rotationQuaternion = null;
    plane.rotation.y = Math.PI;
    const planeMat = new StandardMaterial('_terrainPlaneMat', scene);
    planeMat.disableLighting = true;
    planeMat.specularColor.set(0, 0, 0);
    plane.material = planeMat;
    const pixels = new Uint8Array(256 * 256 * 4);
    for (let i = 0; i < TERRAIN_SIZE; i++) {
      for (let j = 0; j < TERRAIN_SIZE; j++) {
        const ind = i * TERRAIN_SIZE + j;

        const index =
          ((TERRAIN_SIZE - i) * TERRAIN_SIZE + (TERRAIN_SIZE - j)) * 4;

        const attr = terrainAttrs[ind];
        pixels[index + 0] = attr & TWFlags.NoMove ? 255 : 0;
        pixels[index + 1] = attr & TWFlags.SafeZone ? 255 : 0; // Layer2
        // pixels[index + 2] = (attr & TWFlags.Water) ? 255 : 0; // Layer3
        // pixels[index + 3] = (attr & TWFlags.Layer4) ? 255 : 0; // Layer4
      }
    }

    planeMat.transparencyMode = 2;
    planeMat.alpha = 0.5;
    planeMat.emissiveTexture = RawTexture.CreateRGBATexture(
      pixels,
      256,
      256,
      scene,
      false,
      false,
      Texture.NEAREST_NEAREST
    );
  }

  function RequestTerrainFlag(xf: number, yf: number) {
    // xf += 4;

    if (xf < 0 || yf < 0) return 0;

    const xi = ~~(xf);
    const yi = ~~(yf);

    return terrainAttrs[GetTerrainIndex(xi, 256 - yi)];
  }

  function RequestTerrainHeight(xf: number, yf: number) {
    xf += 4;

    if (xf < 0 || yf < 0) return 0;

    // xf /= TERRAIN_SCALE;
    // yf /= TERRAIN_SCALE;

    const xi = ~~xf;
    const yi = ~~yf;

    const index = GetTerrainIndex(xi, yi);

    // If flagged as special height, return SpecialHeight
    // if (
    //   index < terrainAttrs.length &&
    //   isFlagInBinaryMask(terrainAttrs[index], TWFlags.Height)
    // ) {
    //   return SpecialHeight;
    // }

    // Bilinear interpolation of height
    const xd = xf - xi;
    const yd = yf - yi;

    const x1 = xi & TERRAIN_SIZE_MASK,
      y1 = yi & TERRAIN_SIZE_MASK;
    const x2 = (xi + 1) & TERRAIN_SIZE_MASK,
      y2 = (yi + 1) & TERRAIN_SIZE_MASK;

    const i1 = y1 * TERRAIN_SIZE + x1;
    const i2 = y1 * TERRAIN_SIZE + x2;
    const i3 = y2 * TERRAIN_SIZE + x2;
    const i4 = y2 * TERRAIN_SIZE + x1;

    const h1 = terrainHeight[i1];
    const h2 = terrainHeight[i2];
    const h3 = terrainHeight[i3];
    const h4 = terrainHeight[i4];

    return (
      (1 - xd) * (1 - yd) * h1 +
      xd * (1 - yd) * h2 +
      xd * yd * h3 +
      (1 - xd) * yd * h4
    );
  }

  function IsWalkable(x: number, y: number) {
    const terrainFlag = RequestTerrainFlag(x, y);
    return !isFlagInBinaryMask(terrainFlag, TWFlags.NoMove);
  }

  return {
    objects,
    terrain,
    terrainHeight,
    RequestTerrainHeight,
    IsWalkable,
    RequestTerrainFlag,
  };
}
