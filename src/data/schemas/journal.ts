import { z } from 'zod';

export const JournalEntrySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  content: z.string(),
  content_html: z.string().optional(),
  date: z.string(),
  mood: z.string().optional(),
  tags: z.array(z.string()).default([]),
  author_id: z.string().optional(),
  author_name: z.string().optional(),
  location: z.string().optional(),
  is_favorite: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  created_at: z.string().optional()
});

export type JournalEntryEntity = z.infer<typeof JournalEntrySchema>;
