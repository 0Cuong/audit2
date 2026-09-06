import { supabase } from '../../../lib/supabase';
import { BucketItemEntity, BucketItemSchema } from '../../schemas/bucket';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateBucketDTO = Omit<BucketItemEntity, 'id' | 'created_at'>;
export type UpdateBucketDTO = Partial<CreateBucketDTO>;

export type IBucketRepository = BaseRepository<BucketItemEntity, CreateBucketDTO, UpdateBucketDTO>;

export class SupabaseBucketRepository implements IBucketRepository {
  private static readonly TABLE = 'bucket_list_items';
  private static readonly STORAGE_KEY = 'cuongisme_bucket_v2';

  async findAll(): Promise<BucketItemEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseBucketRepository.TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(BucketItemSchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as BucketItemEntity[];
    } catch (e) {
      console.error('Failed to fetch bucket items from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<BucketItemEntity | null> {
    try {
      const { data, error } = await supabase
        .from(SupabaseBucketRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = BucketItemSchema.safeParse(data);
      return parsed.success ? parsed.data : data as BucketItemEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateBucketDTO): Promise<BucketItemEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: BucketItemEntity = { 
      ...data, 
      id: optimisticId,
      created_at: new Date().toISOString()
    };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseBucketRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = BucketItemSchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateBucketDTO): Promise<BucketItemEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: BucketItemEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseBucketRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = BucketItemSchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Bucket item not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from(SupabaseBucketRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): BucketItemEntity[] {
    try {
      const data = localStorage.getItem(SupabaseBucketRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(BucketItemSchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as BucketItemEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: BucketItemEntity[]): void {
    try {
      localStorage.setItem(SupabaseBucketRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota or access blocked
    }
  }
}

export const bucketRepository = new SupabaseBucketRepository();
