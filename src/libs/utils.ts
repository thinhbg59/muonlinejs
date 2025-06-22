export function assertNotImplemented(x: never): never {
  throw new Error('not implemented:' + x);
}
