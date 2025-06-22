import items from './items.json';

export const ItemsDatabase = new (class _ItemsDatabase {
  cache: Record<number, Record<number, (typeof items)[number]>> = {};

  constructor() {
    for (const item of items) {
      if (!this.cache[item.ItemSubGroup]) {
        this.cache[item.ItemSubGroup] = {};
      }
      this.cache[item.ItemSubGroup][item.ItemSubIndex] = item;
    }
  }

  getItem(group: number, id: number) {
    return this.cache[group]?.[id] || null;
  }
})();
