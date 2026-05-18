import { Router, Request, Response } from 'express';
import { reviewStore } from '../store/reviewStore';
import { store } from '../store/itemStore';
import { CreateReviewSchema } from '../validation/reviewSchema';
import { requireAuth } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = Router({ mergeParams: true });

router.get('/', async (req: Request, res: Response) => {
  const item = await store.getById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  return res.json(await reviewStore.getByItemId(req.params.itemId));
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const item = await store.getById(req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const parsed = CreateReviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  const created = await reviewStore.create(req.params.itemId, parsed.data);
  await audit(req, 'CREATE_REVIEW', `Created review ${created.id} for item ${req.params.itemId}`);
  return res.status(201).json(created);
});

router.delete('/:reviewId', requireAuth, async (req: Request, res: Response) => {
  if (!(await reviewStore.delete(req.params.itemId, req.params.reviewId))) {
    return res.status(404).json({ error: 'Review not found' });
  }
  await audit(req, 'DELETE_REVIEW', `Deleted review ${req.params.reviewId} for item ${req.params.itemId}`);
  return res.status(204).send();
});

export default router;
