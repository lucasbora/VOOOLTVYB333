import express, { NextFunction, Request, Response } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import itemsRouter from './routes/items';
import statsRouter from './routes/stats';
import generatorRouter from './routes/generator';
import reviewsRouter from './routes/reviews';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import chatRouter from './routes/chat';
import { schema } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { attachUser } from './middleware/auth';

const app = express();

app.use(express.json());
app.use(attachUser);

app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/items/:itemId/reviews', reviewsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/generator', generatorRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);

app.use('/graphql', createHandler({ schema, rootValue: resolvers }));

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
