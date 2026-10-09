import { z } from 'zod';

export const TimelineEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string(),
  image_url: z.string().optional(),
  category: z.string().default('milestone'),
  icon: z.string().optional(),
  is_favorite: z.boolean().default(false),
  created_at: z.string().optional()
});

export type TimelineEventEntity = z.infer<typeof TimelineEventSchema>;
