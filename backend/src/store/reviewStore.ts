import { Review, CreateReviewDto } from '../validation/reviewSchema';
import { prisma } from '../db/prisma';
import { seedReviews } from './reviewSeed';

export const reviewStore = {
  async getByItemId(itemId: string): Promise<Review[]> {
    const reviews = await prisma.review.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async getAll(): Promise<Review[]> {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
    return reviews.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));
  },

  async create(itemId: string, data: CreateReviewDto): Promise<Review> {
    const row = await prisma.review.create({
      data: {
        itemId,
        author: data.author,
        rating: data.rating,
        comment: data.comment,
      },
    });

    return {
      id: row.id,
      itemId: row.itemId,
      author: row.author,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
    };
  },

  async delete(itemId: string, reviewId: string): Promise<boolean> {
    const review = await prisma.review.findFirst({ where: { id: reviewId, itemId } });
    if (!review) return false;
    await prisma.review.delete({ where: { id: reviewId } });
    return true;
  },

  async reset(): Promise<void> {
    await prisma.review.deleteMany();
    for (const r of seedReviews) {
      await prisma.review.upsert({
        where: { id: r.id },
        update: { author: r.author, rating: r.rating, comment: r.comment },
        create: {
          id: r.id,
          itemId: r.itemId,
          author: r.author,
          rating: r.rating,
          comment: r.comment,
          createdAt: new Date(r.createdAt),
        },
      });
    }
  },
};
