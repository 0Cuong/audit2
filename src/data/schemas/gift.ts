import { z } from 'zod';
import { BaseEntity, CoreTimestamps } from '../core/BaseEntity';

export const GiftItemSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith('local-')),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  occasion: z.string().optional().nullable(),
  price_range: z.string().optional().nullable(),
  is_received: z.boolean().default(false),
  for_partner: z.string().optional().nullable(),
  ...CoreTimestamps
});

export type GiftItemEntity = z.infer<typeof GiftItemSchema>;
