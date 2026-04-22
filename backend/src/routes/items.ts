import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { store } from '../store/itemStore';
import { CreateItemSchema, UpdateItemSchema } from '../validation/itemSchema';

const router = Router();

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  colorGroup: z.string().optional(),
});

router.get('/', (req: Request, res: Response) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const { page, limit, category, inStock, colorGroup } = parsed.data;
  let items = store.getAll();

  if (category !== undefined) items = items.filter(i => i.category === category);
  if (inStock !== undefined) items = items.filter(i => i.inStock === (inStock === 'true'));
  if (colorGroup !== undefined) items = items.filter(i => i.colorGroup === colorGroup);

  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const data = items.slice((page - 1) * limit, page * limit);

  return res.json({ data, page, limit, total, totalPages });
});

router.get('/:id', (req: Request, res: Response) => {
  const item = store.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  return res.json(item);
});

router.post('/', (req: Request, res: Response) => {
  const parsed = CreateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }
  return res.status(201).json(store.create(parsed.data));
});

router.put('/:id', (req: Request, res: Response) => {
  const parsed = CreateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }
  const item = store.replace(req.params.id, parsed.data);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  return res.json(item);
});

router.patch('/:id', (req: Request, res: Response) => {
  const parsed = UpdateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }
  const item = store.update(req.params.id, parsed.data);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  return res.json(item);
});

router.delete('/:id', (req: Request, res: Response) => {
  if (!store.delete(req.params.id)) {
    return res.status(404).json({ error: 'Item not found' });
  }
  return res.status(204).send();
});

export default router;
