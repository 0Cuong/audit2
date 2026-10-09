import { z } from 'zod';

export const MoodEntrySchema = z.object({
  id: z.string(),
  mood: z.string().min(1, 'Mood is required'),
  note: z.string().optional().default(''),
  date: z.string().optional(),
  partner: z.string().optional(),
  partner_id: z.string().optional(),
  partner_name: z.string().optional(),
  intensity: z.number().optional().default(3),
  couple_id: z.string().optional(),
  created_at: z.string().optional()
}).transform((entry) => ({
  id: entry.id,
  mood: entry.mood,
  note: entry.note || '',
  date: entry.date || entry.created_at || new Date().toISOString(),
  partner_id: entry.partner_id || entry.partner || 'partner1',
  partner_name: entry.partner_name,
  intensity: entry.intensity ?? 3,
  couple_id: entry.couple_id,
  created_at: entry.created_at || entry.date || new Date().toISOString()
}));

export type MoodEntryEntity = z.infer<typeof MoodEntrySchema>;
