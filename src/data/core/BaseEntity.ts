import { z } from 'zod';

export const CoreTimestamps = {
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
};

export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}
