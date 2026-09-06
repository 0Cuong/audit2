import { z } from 'zod';
import { CoreTimestamps } from '../core/BaseEntity';

export const LetterSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith('local-')),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  from_partner: z.string(),
  to_partner: z.string(),
  is_draft: z.boolean().default(false),
  is_locked: z.boolean().default(false),
  is_future: z.boolean().default(false),
  scheduled_at: z.string().nullable().optional(),
  reaction: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  ...CoreTimestamps
});

export type LoveLetterEntity = z.infer<typeof LetterSchema>;
