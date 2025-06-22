import type { ISystemFactory } from '../world';

export const OutOfScopeSystem: ISystemFactory = world => {
  const query = world.with('objOutOfScope');

  return {
    update: () => {
      for (const e of query) {
        world.remove(e);

        if (e.modelObject) {
          e.modelObject.dispose();
        }
      }
    },
  };
};
