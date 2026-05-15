import { ClothingItem } from '../validation/itemSchema';

export function serializeArray(values: string[]): string {
  return JSON.stringify(values);
}

export function deserializeArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toDomainItem(row: {
  id: string;
  name: string;
  category: string;
  price: number;
  colorHex: string;
  colorName: string;
  colorGroup: string;
  styleTags: string;
  rating: number;
  description: string;
  material: string;
  sizes: string;
  inStock: boolean;
  imageUrl: string;
  featured: boolean;
  stock: number;
}): ClothingItem {
  return {
    ...row,
    styleTags: deserializeArray(row.styleTags) as ClothingItem['styleTags'],
    sizes: deserializeArray(row.sizes),
    category: row.category as ClothingItem['category'],
    colorGroup: row.colorGroup as ClothingItem['colorGroup'],
  };
}
