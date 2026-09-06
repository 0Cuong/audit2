import { z } from 'zod';
import { CoreTimestamps } from '../core/BaseEntity';

export const BucketItemSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith('local-')),
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['travel', 'experiences', 'life', 'dreams']),
  description: z.string().optional().nullable(),
  is_completed: z.boolean().default(false),
  completed_at: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  ...CoreTimestamps
});

export type BucketItemEntity = z.infer<typeof BucketItemSchema>;
