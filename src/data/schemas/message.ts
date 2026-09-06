import { z } from 'zod';
import { CoreTimestamps } from '../core/BaseEntity';

export const MessageItemSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith('local-')),
  content: z.string().min(1, 'Content is required'),
  message_type: z.enum(['note', 'reminder', 'question']),
  is_pinned: z.boolean().default(false),
  ...CoreTimestamps
});

export type MessageItemEntity = z.infer<typeof MessageItemSchema>;
