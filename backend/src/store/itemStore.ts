import { ClothingItem, CreateItemDto, UpdateItemDto } from '../validation/itemSchema';
import { initialItems } from './initialData';

let items: ClothingItem[] = initialItems.map(i => ({ ...i }));
let idCounter = initialItems.length + 1;

export const store = {
  getAll(): ClothingItem[] {
    return items;
  },

  getById(id: string): ClothingItem | undefined {
    return items.find(i => i.id === id);
  },

  create(data: CreateItemDto): ClothingItem {
    const item: ClothingItem = { ...data, id: String(idCounter++) };
    items.push(item);
    return item;
  },

  replace(id: string, data: CreateItemDto): ClothingItem | null {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...data, id };
    return items[idx];
  },

  update(id: string, data: UpdateItemDto): ClothingItem | null {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data };
    return items[idx];
  },

  delete(id: string): boolean {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    return true;
  },

  reset(): void {
    items = initialItems.map(i => ({ ...i }));
    idCounter = initialItems.length + 1;
  },

  clear(): void {
    items = [];
    idCounter = 1;
  },
};
