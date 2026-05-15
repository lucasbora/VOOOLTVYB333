import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  author: z.string().min(1, 'Author is required').max(50),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(1, 'Comment is required').max(500),
  createdAt: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = ReviewSchema.omit({ id: true, itemId: true, createdAt: true });
export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
