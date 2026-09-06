import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { MoodEntryEntity, MoodEntrySchema } from '../../schemas/mood';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateMoodDTO = {
  mood: string;
  note?: string;
  date?: string;
  partner_id?: string;
  partner_name?: string;
  intensity?: number;
  couple_id?: string;
  created_at?: string;
  partner?: string;
};
export type UpdateMoodDTO = Partial<CreateMoodDTO>;

export type IMoodRepository = BaseRepository<MoodEntryEntity, CreateMoodDTO, UpdateMoodDTO>;

export class SupabaseMoodRepository implements IMoodRepository {
  private static readonly TABLE = 'mood_entries';
  private static readonly STORAGE_KEY = 'cuongisme_moods_v2';

  async findAll(): Promise<MoodEntryEntity[]> {
    if (!isSupabaseConfigured) {
      return this.getCachedData();
    }

    try {
      const { data, error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(MoodEntrySchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as MoodEntryEntity[];
    } catch (e) {
      console.warn('Supabase mood fetch failed, using local cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<MoodEntryEntity | null> {
    if (!isSupabaseConfigured) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = MoodEntrySchema.safeParse(data);
      return parsed.success ? parsed.data : data as MoodEntryEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateMoodDTO): Promise<MoodEntryEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: MoodEntryEntity = {
      id: optimisticId,
      mood: data.mood,
      note: data.note || '',
      date: data.date || new Date().toISOString(),
      partner_id: data.partner_id || (data as any).partner || 'partner1',
      partner_name: data.partner_name,
      intensity: data.intensity ?? 3,
      couple_id: data.couple_id,
      created_at: data.created_at || new Date().toISOString(),
    };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    if (!isSupabaseConfigured) {
      return optimisticEntry;
    }

    try {
      const supabasePayload: Record<string, any> = {
        mood: data.mood,
        note: data.note || '',
        partner: data.partner_id || (data as any).partner || 'partner1',
      };
      if (data.couple_id) {
        supabasePayload.couple_id = data.couple_id;
      }

      const { data: created, error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .insert(supabasePayload)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = MoodEntrySchema.parse(created);
      this.cacheData([parsed, ...cached.filter(m => m.id !== optimisticId)]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateMoodDTO): Promise<MoodEntryEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: MoodEntryEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    if (!isSupabaseConfigured) {
      if (optimisticData) return optimisticData;
      throw new Error('Mood entry not found');
    }

    try {
      const supabasePayload: Record<string, any> = {};
      if (data.mood !== undefined) supabasePayload.mood = data.mood;
      if (data.note !== undefined) supabasePayload.note = data.note;
      if (data.partner_id !== undefined || (data as any).partner !== undefined) {
        supabasePayload.partner = data.partner_id || (data as any).partner;
      }
      if (data.couple_id !== undefined) supabasePayload.couple_id = data.couple_id;

      const { data: updated, error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .update(supabasePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = MoodEntrySchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Mood entry not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    if (!isSupabaseConfigured) {
      return;
    }

    try {
      const { error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): MoodEntryEntity[] {
    try {
      const data = localStorage.getItem(SupabaseMoodRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(MoodEntrySchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as MoodEntryEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: MoodEntryEntity[]): void {
    try {
       localStorage.setItem(SupabaseMoodRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota or access blocked
    }
  }
}

export const moodRepository = new SupabaseMoodRepository();
