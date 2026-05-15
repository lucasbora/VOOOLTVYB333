import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { chatStore } from '../chat/chatStore';

const router = Router();

const MessageSchema = z.object({
  roomId: z.string().min(1).default('global'),
  text: z.string().min(1).max(1000),
});

router.get('/:roomId/messages', requireAuth, async (req: Request, res: Response) => {
  const messages = await chatStore.getMessages(req.params.roomId, 100);
  return res.json(messages);
});

router.post('/messages', requireAuth, async (req: Request, res: Response) => {
  const parsed = MessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });

  const message = await chatStore.addMessage({
    roomId: parsed.data.roomId,
    userId: req.currentUser!.id,
    username: req.currentUser!.username,
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json(message);
});

export default router;
