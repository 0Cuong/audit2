import { supabase } from '../../../lib/supabase';
import { MoodEntryEntity, MoodEntrySchema } from '../../schemas/mood';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateMoodDTO = Omit<MoodEntryEntity, 'id' | 'created_at'>;
export type UpdateMoodDTO = Partial<CreateMoodDTO>;

export interface IMoodRepository extends BaseRepository<MoodEntryEntity, CreateMoodDTO, UpdateMoodDTO> {}

export class SupabaseMoodRepository implements IMoodRepository {
  private static readonly TABLE = 'mood_entries';
  private static readonly STORAGE_KEY = 'cuongisme_moods_v2';

  async findAll(): Promise<MoodEntryEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(MoodEntrySchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as MoodEntryEntity[];
    } catch (e) {
      console.error('Failed to fetch moods from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<MoodEntryEntity | null> {
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
    const optimisticId = \`local-\${Date.now()}\`;
    const optimisticEntry: MoodEntryEntity = { ...data, id: optimisticId };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = MoodEntrySchema.parse(created);
      this.cacheData([parsed, ...cached]);
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

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseMoodRepository.TABLE)
        .update(data)
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
    } catch {}
  }
}

export const moodRepository = new SupabaseMoodRepository();
