export const BITMAP_WATER = 1; //pointer?
export const BITMAP_MAPTILE = 1000; //pointer
export const Bitmaps: { Width: Float; Height: Float }[] = [];

export const TERRAIN_SCALE = 1.0;
export const TERRAIN_SIZE = 256;
export const TERRAIN_SIZE_MASK = 255;
export const SIZE_OF_WORD = 2;

export const TW_SAFEZONE = 0x0001;
export const TW_CHARACTER = 0x0002;
export const TW_NOMOVE = 0x0004;
export const TW_NOGROUND = 0x0008;
export const TW_WATER = 0x0010;
export const TW_ACTION = 0x0020;
export const TW_HEIGHT = 0x0040;
export const TW_CAMERA_UP = 0x0080;
export const TW_NOATTACKZONE = 0x0100;
export const TW_ATT1 = 0x0200;
export const TW_ATT2 = 0x0400;
export const TW_ATT3 = 0x0800;
export const TW_ATT4 = 0x1000;
export const TW_ATT5 = 0x2000;
export const TW_ATT6 = 0x4000;
export const TW_ATT7 = 0x8000;

export enum TWFlags {
  None = 0x0000,
  SafeZone = 0x0001, // 1
  Character = 0x0002, // 2
  NoMove = 0x0004, // 4
  NoGround = 0x0008, // 8
  Water = 0x0010, // 16
  Action = 0x0020, // 32
  Height = 0x0040, // 64
  CameraUp = 0x0080, // 128
  NoAttackZone = 0x0100, // 256
  Att1 = 0x0200, // 512
  Att2 = 0x0400, // 1024
  Att3 = 0x0800, // 2048
  Att4 = 0x1000, // 4096
  Att5 = 0x2000, // 8192
  Att6 = 0x4000, // 16384
  Att7 = 0x8000, // 32768
}

export const SERVER_LIST_SCENE = 0;
export const NON_SCENE = 0;
export const WEBZEN_SCENE = 1;
export const LOG_IN_SCENE = 2;
export const LOADING_SCENE = 3;
export const CHARACTER_SCENE = 4;
export const MAIN_SCENE = 5;
export const MOVIE_SCENE = 6;

export const TERRAIN_MAP_NORMAL = 0;
export const TERRAIN_MAP_ALPHA = 1;
export const TERRAIN_MAP_GRASS = 2;
export const TERRAIN_MAP_TRAP = 3;

export const SpecialHeight = 1200;
