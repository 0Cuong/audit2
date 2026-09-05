import { z } from 'zod';

export const MoodEntrySchema = z.object({
  id: z.string(),
  mood: z.string().min(1, 'Mood is required'),
  note: z.string().optional(),
  date: z.string(),
  partner_id: z.string().optional(),
  partner_name: z.string().optional(),
  intensity: z.number().default(3),
  created_at: z.string().optional()
});

export type MoodEntryEntity = z.infer<typeof MoodEntrySchema>;
