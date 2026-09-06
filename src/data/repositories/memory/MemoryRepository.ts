import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { MemoryEntity, MemorySchema } from '../../schemas/memory';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateMemoryDTO = Omit<MemoryEntity, 'id' | 'created_at'>;
export type UpdateMemoryDTO = Partial<CreateMemoryDTO>;

export interface IMemoryRepository extends BaseRepository<MemoryEntity, CreateMemoryDTO, UpdateMemoryDTO> {
  findByCollection(collectionId: string): Promise<MemoryEntity[]>;
  findFavorites(): Promise<MemoryEntity[]>;
}

export class SupabaseMemoryRepository implements IMemoryRepository {
  private static readonly TABLE = 'memories';
  private static readonly STORAGE_KEY = 'cuongisme_memories_v2';

  async findAll(): Promise<MemoryEntity[]> {
    if (!isSupabaseConfigured) {
      return this.getCachedData();
    }

    try {
      const { data, error } = await supabase
        .from(SupabaseMemoryRepository.TABLE)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(MemorySchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as MemoryEntity[];
    } catch (e) {
      console.warn('Supabase memory fetch failed, using local cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<MemoryEntity | null> {
    if (!isSupabaseConfigured) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from(SupabaseMemoryRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = MemorySchema.safeParse(data);
      return parsed.success ? parsed.data : data as MemoryEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async findByCollection(collectionId: string): Promise<MemoryEntity[]> {
    if (!isSupabaseConfigured) {
      return this.getCachedData().filter(m => m.collection_ids?.includes(collectionId));
    }

    try {
      const { data, error } = await supabase
        .from(SupabaseMemoryRepository.TABLE)
        .select('*')
        .contains('collection_ids', [collectionId])
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as MemoryEntity[];
    } catch (e) {
      return this.getCachedData().filter(m => m.collection_ids?.includes(collectionId));
    }
  }

  async findFavorites(): Promise<MemoryEntity[]> {
    if (!isSupabaseConfigured) {
      return this.getCachedData().filter(m => m.is_favorite);
    }

    try {
      const { data, error } = await supabase
        .from(SupabaseMemoryRepository.TABLE)
        .select('*')
        .eq('is_favorite', true)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as MemoryEntity[];
    } catch (e) {
      return this.getCachedData().filter(m => m.is_favorite);
    }
  }

  async create(data: CreateMemoryDTO): Promise<MemoryEntity> {
    // Generate an optimistic ID for local cache immediately
    const optimisticId = `local-${Date.now()}`;
    const optimisticMemory: MemoryEntity = { ...data, id: optimisticId };
    
    // Update local cache optimistically
    const cached = this.getCachedData();
    this.cacheData([optimisticMemory, ...cached]);

    if (!isSupabaseConfigured) {
      return optimisticMemory;
    }

    try {
      const { data: created, error } = await supabase
        .from(SupabaseMemoryRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      // Update cache with real data
      const parsed = MemorySchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      console.warn('Failed to save to Supabase, data only saved locally', e);
      return optimisticMemory;
    }
  }

  async update(id: string, data: UpdateMemoryDTO): Promise<MemoryEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: MemoryEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    if (!isSupabaseConfigured) {
      if (optimisticData) return optimisticData;
      throw new Error('Memory not found in local cache or server');
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseMemoryRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = MemorySchema.parse(updated);
      
      // Re-update cache with real data to be safe
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      console.warn('Failed to update Supabase, updated locally only', e);
      if (optimisticData) return optimisticData;
      throw new Error('Memory not found in local cache or server');
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
        .from(SupabaseMemoryRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  // --- Private Helpers ---
  private getCachedData(): MemoryEntity[] {
    try {
      const data = localStorage.getItem(SupabaseMemoryRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(MemorySchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as MemoryEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: MemoryEntity[]): void {
    try {
      localStorage.setItem(SupabaseMemoryRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage might be full or blocked
    }
  }
}

export const memoryRepository = new SupabaseMemoryRepository();
