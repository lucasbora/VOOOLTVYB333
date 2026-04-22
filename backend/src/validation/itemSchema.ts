import { z } from 'zod';

const CATEGORIES = [
  'tee', 'pants', 'cap', 'hoodie', 'jacket',
  'shorts', 'bag', 'shoes', 'socks', 'accessories',
] as const;

const COLOR_GROUPS = ['warm', 'cool', 'neutral', 'vibrant', 'dark'] as const;

const STYLE_TAGS = [
  'streetwear', 'sporty', 'minimal', 'avant-garde', 'casual', 'techwear',
] as const;

export const ClothingItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(CATEGORIES),
  price: z.number().positive('Price must be positive'),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g. #FF0000)'),
  colorName: z.string().min(1, 'Color name is required'),
  colorGroup: z.enum(COLOR_GROUPS),
  styleTags: z.array(z.enum(STYLE_TAGS)).min(1, 'At least one style tag is required'),
  rating: z.number().min(0).max(5),
  description: z.string().min(1, 'Description is required'),
  material: z.string().min(1, 'Material is required'),
  sizes: z.array(z.string()).min(1, 'At least one size is required'),
  inStock: z.boolean(),
  imageUrl: z.string().url('Must be a valid URL'),
  featured: z.boolean(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
});

export type ClothingItem = z.infer<typeof ClothingItemSchema>;

export const CreateItemSchema = ClothingItemSchema.omit({ id: true });
export type CreateItemDto = z.infer<typeof CreateItemSchema>;

export const UpdateItemSchema = CreateItemSchema.partial();
export type UpdateItemDto = z.infer<typeof UpdateItemSchema>;
