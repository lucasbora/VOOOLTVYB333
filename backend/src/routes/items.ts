import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { store } from '../store/itemStore';
import { CreateItemSchema, UpdateItemSchema } from '../validation/itemSchema';
import { requireAuth, requirePermission } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = Router();

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  colorGroup: z.string().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const { page, limit, category, inStock, colorGroup } = parsed.data;
  let items = await store.getAll();

  if (category !== undefined) items = items.filter(i => i.category === category);
  if (inStock !== undefined) items = items.filter(i => i.inStock === (inStock === 'true'));
  if (colorGroup !== undefined) items = items.filter(i => i.colorGroup === colorGroup);

  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const data = items.slice((page - 1) * limit, page * limit);

  return res.json({ data, page, limit, total, totalPages });
});

router.get('/:id', async (req: Request, res: Response) => {
  const item = await store.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  return res.json(item);
});

router.post('/', requireAuth, requirePermission('ITEM_CREATE'), async (req: Request, res: Response) => {
  const parsed = CreateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }
  const created = await store.create(parsed.data);
  await audit(req, 'CREATE_ITEM', `Created item ${created.id}`);
  return res.status(201).json(created);
});

router.put('/:id', requireAuth, requirePermission('ITEM_UPDATE'), async (req: Request, res: Response) => {
  const parsed = CreateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }
  const item = await store.replace(req.params.id, parsed.data);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await audit(req, 'REPLACE_ITEM', `Replaced item ${item.id}`);
  return res.json(item);
});

router.patch('/:id', requireAuth, requirePermission('ITEM_UPDATE'), async (req: Request, res: Response) => {
  const parsed = UpdateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }
  const item = await store.update(req.params.id, parsed.data);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await audit(req, 'UPDATE_ITEM', `Updated item ${item.id}`);
  return res.json(item);
});

router.delete('/:id', requireAuth, requirePermission('ITEM_DELETE'), async (req: Request, res: Response) => {
  const item = await store.getById(req.params.id);
  if (!(await store.delete(req.params.id))) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (item) await audit(req, 'DELETE_ITEM', `Deleted item ${item.id}`);
  return res.status(204).send();
});

export default router;
