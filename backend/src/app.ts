import express, { NextFunction, Request, Response } from 'express';
import itemsRouter from './routes/items';
import statsRouter from './routes/stats';

const app = express();

app.use(express.json());

app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
