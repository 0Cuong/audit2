import { supabase } from '../../../lib/supabase';
import { LoveLetterEntity, LetterSchema } from '../../schemas/letter';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateLetterDTO = Omit<LoveLetterEntity, 'id' | 'created_at'>;
export type UpdateLetterDTO = Partial<CreateLetterDTO>;

export type ILetterRepository = BaseRepository<LoveLetterEntity, CreateLetterDTO, UpdateLetterDTO>;

export class SupabaseLetterRepository implements ILetterRepository {
  private static readonly TABLE = 'love_letters';
  private static readonly STORAGE_KEY = 'cuongisme_letters_v2';

  async findAll(): Promise<LoveLetterEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseLetterRepository.TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(LetterSchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as LoveLetterEntity[];
    } catch (e) {
      console.error('Failed to fetch letters from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<LoveLetterEntity | null> {
    try {
      const { data, error } = await supabase
        .from(SupabaseLetterRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = LetterSchema.safeParse(data);
      return parsed.success ? parsed.data : data as LoveLetterEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateLetterDTO): Promise<LoveLetterEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: LoveLetterEntity = { 
      ...data, 
      id: optimisticId,
      created_at: new Date().toISOString()
    };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseLetterRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = LetterSchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateLetterDTO): Promise<LoveLetterEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: LoveLetterEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseLetterRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = LetterSchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Letter entry not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from(SupabaseLetterRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): LoveLetterEntity[] {
    try {
      const data = localStorage.getItem(SupabaseLetterRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(LetterSchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as LoveLetterEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: LoveLetterEntity[]): void {
    try {
      localStorage.setItem(SupabaseLetterRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota or access blocked
    }
  }
}

export const letterRepository = new SupabaseLetterRepository();
