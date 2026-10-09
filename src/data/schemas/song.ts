import { z } from 'zod';
import { CoreTimestamps } from '../core/BaseEntity';

export const SongItemSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith('local-')),
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional().nullable(),
  url: z.string().url('Must be a valid URL'),
  is_favorite: z.boolean().default(false),
  is_background: z.boolean().default(false),
  artwork_url: z.string().optional().nullable(),
  ...CoreTimestamps
});

export type SongItemEntity = z.infer<typeof SongItemSchema>;
