import { Router, Request, Response } from 'express';
import { store } from '../store/itemStore';
import { broadcast } from '../ws/broadcaster';
import { CreateItemDto } from '../validation/itemSchema';
import { requireAuth, requirePermission } from '../middleware/auth';
import { audit } from '../middleware/audit';

const router = Router();

const CATEGORIES = ['tee', 'pants', 'cap', 'hoodie', 'jacket', 'shorts', 'bag', 'shoes', 'socks', 'accessories'] as const;
const COLOR_GROUPS = ['warm', 'cool', 'neutral', 'vibrant', 'dark'] as const;
const STYLE_TAGS = ['streetwear', 'sporty', 'minimal', 'avant-garde', 'casual', 'techwear'] as const;
const INTERVAL_MS = 3000;

let generatorInterval: ReturnType<typeof setInterval> | null = null;
let fakerLoader: Promise<{ faker: any }> | null = null;

function getFaker() {
  if (!fakerLoader) fakerLoader = import('@faker-js/faker');
  return fakerLoader;
}

async function generateFakeItem(): Promise<CreateItemDto> {
  const { faker } = await getFaker();
  const hex = faker.color.rgb({ format: 'hex', prefix: '#' });
  return {
    name: faker.commerce.productName().toUpperCase(),
    category: faker.helpers.arrayElement(CATEGORIES),
    price: parseFloat(faker.commerce.price({ min: 15, max: 200 })),
    colorHex: hex.length >= 7 ? hex.slice(0, 7) : '#AAAAAA',
    colorName: faker.color.human(),
    colorGroup: faker.helpers.arrayElement(COLOR_GROUPS),
    styleTags: faker.helpers.arrayElements([...STYLE_TAGS], faker.number.int({ min: 1, max: 3 })),
    rating: Math.round(faker.number.float({ min: 3.5, max: 5.0 }) * 10) / 10,
    description: faker.commerce.productDescription(),
    material: `${faker.commerce.productMaterial()} Blend`,
    sizes: faker.helpers.arrayElements(['XS', 'S', 'M', 'L', 'XL', 'XXL'], faker.number.int({ min: 2, max: 5 })),
    inStock: faker.datatype.boolean({ probability: 0.85 }),
    imageUrl: `https://picsum.photos/seed/${faker.string.alphanumeric(8)}/600/600`,
    featured: faker.datatype.boolean({ probability: 0.2 }),
    stock: faker.number.int({ min: 0, max: 100 }),
  };
}

router.post('/start', requireAuth, requirePermission('GENERATOR_CONTROL'), async (req: Request, res: Response) => {
  if (generatorInterval) return res.json({ status: 'already_running' });
  generatorInterval = setInterval(async () => {
    try {
      const item = await store.create(await generateFakeItem());
      const totalItems = (await store.getAll()).length;
      broadcast({ type: 'ITEM_ADDED', item, totalItems });
    } catch {
      // keep generator alive even if faker import/generation fails once
    }
  }, INTERVAL_MS);
  await audit(req, 'GENERATOR_START', 'Started fake item generator');
  return res.json({ status: 'started', intervalMs: INTERVAL_MS });
});

router.post('/stop', requireAuth, requirePermission('GENERATOR_CONTROL'), async (req: Request, res: Response) => {
  if (!generatorInterval) return res.json({ status: 'not_running' });
  clearInterval(generatorInterval);
  generatorInterval = null;
  await audit(req, 'GENERATOR_STOP', 'Stopped fake item generator');
  return res.json({ status: 'stopped' });
});

router.get('/status', (_req: Request, res: Response) => {
  return res.json({ running: generatorInterval !== null });
});

export default router;
