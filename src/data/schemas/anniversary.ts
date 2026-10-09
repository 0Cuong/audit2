import { z } from 'zod';

export const AnniversarySchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  date: z.string(),
  type: z.string().default('yearly'),
  notes: z.string().optional(),
  photo_url: z.string().optional(),
  reminder_days: z.number().optional(),
  created_at: z.string().optional()
});

export type AnniversaryEntity = z.infer<typeof AnniversarySchema>;
