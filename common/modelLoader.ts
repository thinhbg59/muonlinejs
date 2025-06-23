import { BMD, BMDReader } from './BMD';
import { downloadDataBytesBuffer } from './utils';

function padZero(num: number) {
  return num.toString().padStart(2, '0');
}

const reader = new BMDReader();
const Models: Partial<Record<number, Promise<BMD>>> = {};
const ModelsFactory: Record<number, () => Promise<BMD>> = {};

export async function getModel(modelId: number) {
  if (Models[modelId]) return Models[modelId];

  if (!ModelsFactory[modelId])
    throw new Error(`Model factory for ID ${modelId} not found`);

  Models[modelId] = ModelsFactory[modelId]();
  return Models[modelId];
}

const cache: Partial<Record<string, Promise<BMD>>> = {};

export async function loadBMD(
  filePath: string,
  dir: string = ''
): Promise<BMD> {
  if (cache[filePath]) return cache[filePath];

  if (!dir) {
    dir = filePath.split('/').slice(0, -1).join('/') + '/';
  }

  cache[filePath] = new Promise(async r => {
    try {
      r(reader.read(await downloadDataBytesBuffer(filePath), dir));
    } catch (error) {
      console.error(`Error loading BMD from ${filePath}:`, error);
      throw error;
    }
  });

  return cache[filePath];
}

export const ObjectRegistry = {
  RegisterFactory: (
    Type: number,
    Dir: string,
    FileName: string,
    i: Int = -1
  ) => {
    let Name = '';

    if (i === -1) {
      Name = `${FileName}.bmd`;
    } else {
      Name = `${FileName}${padZero(i)}.bmd`;
    }

    const filePath = Dir + Name;

    ModelsFactory[Type] = async () => loadBMD(filePath, Dir);
  },
};
