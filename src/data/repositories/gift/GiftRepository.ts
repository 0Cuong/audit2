import { supabase } from '../../../lib/supabase';
import { GiftItemEntity, GiftItemSchema } from '../../schemas/gift';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateGiftDTO = Omit<GiftItemEntity, 'id' | 'created_at'>;
export type UpdateGiftDTO = Partial<CreateGiftDTO>;

export type IGiftRepository = BaseRepository<GiftItemEntity, CreateGiftDTO, UpdateGiftDTO>;

export class SupabaseGiftRepository implements IGiftRepository {
  private static readonly TABLE = 'gifts';
  private static readonly STORAGE_KEY = 'cuongisme_gifts_v2';

  async findAll(): Promise<GiftItemEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseGiftRepository.TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(GiftItemSchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as GiftItemEntity[];
    } catch (e) {
      console.error('Failed to fetch gifts from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<GiftItemEntity | null> {
    try {
      const { data, error } = await supabase
        .from(SupabaseGiftRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = GiftItemSchema.safeParse(data);
      return parsed.success ? parsed.data : data as GiftItemEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateGiftDTO): Promise<GiftItemEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: GiftItemEntity = { 
      ...data, 
      id: optimisticId,
      created_at: new Date().toISOString()
    };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseGiftRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = GiftItemSchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateGiftDTO): Promise<GiftItemEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: GiftItemEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseGiftRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = GiftItemSchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Gift entry not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from(SupabaseGiftRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): GiftItemEntity[] {
    try {
      const data = localStorage.getItem(SupabaseGiftRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(GiftItemSchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as GiftItemEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: GiftItemEntity[]): void {
    try {
      localStorage.setItem(SupabaseGiftRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota or access blocked
    }
  }
}

export const giftRepository = new SupabaseGiftRepository();
