import { z } from 'zod';

export const LocationSchema = z.object({
  name: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional()
});

export const MemorySchema = z.object({
  id: z.string(),
  author_id: z.string().optional(),
  author_name: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  media_type: z.enum(['photo', 'video', 'voice', 'letter', 'location', 'text']),
  category: z.string().optional(),
  context: z.string().optional(),
  url: z.string().optional(),
  date: z.string(),
  is_favorite: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  collection_ids: z.array(z.string()).default([]),
  location: LocationSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  created_at: z.string().optional()
});

export type MemoryEntity = z.infer<typeof MemorySchema>;
export type LocationEntity = z.infer<typeof LocationSchema>;
