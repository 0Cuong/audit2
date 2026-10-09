import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { apiGovernance } from '../../../lib/api-governance';
import { AnniversaryEntity, AnniversarySchema } from '../../schemas/anniversary';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateAnniversaryDTO = Omit<AnniversaryEntity, 'id' | 'created_at'>;
export type UpdateAnniversaryDTO = Partial<CreateAnniversaryDTO>;

export type IAnniversaryRepository = BaseRepository<AnniversaryEntity, CreateAnniversaryDTO, UpdateAnniversaryDTO>;

export class SupabaseAnniversaryRepository implements IAnniversaryRepository {
  private static readonly TABLE = 'anniversaries';
  private static readonly STORAGE_KEY = 'cuongisme_anniversaries_v2';

  async findAll(): Promise<AnniversaryEntity[]> {
    if (!isSupabaseConfigured) {
      return this.getCachedData();
    }

    try {
      const data = await apiGovernance.fetchWithGovernance<any[]>(
        'repo_anniversary_all',
        async () => {
          const { data: resData, error } = await supabase
        .from(SupabaseAnniversaryRepository.TABLE)
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
              return resData || [];
        },
        { ttl: 300000 }
      );

      if (!data) return [];

      const parsed = z.array(AnniversarySchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as AnniversaryEntity[];
    } catch (e) {
      console.warn('Supabase anniversary fetch failed, using local cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<AnniversaryEntity | null> {
    if (!isSupabaseConfigured) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from(SupabaseAnniversaryRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
        
      if (!data) return null;
      
      const parsed = AnniversarySchema.safeParse(data);
      return parsed.success ? parsed.data : data as AnniversaryEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateAnniversaryDTO): Promise<AnniversaryEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: AnniversaryEntity = { ...data, id: optimisticId };
    
    const cached = this.getCachedData();
    this.cacheData([...cached, optimisticEntry]);

    if (!isSupabaseConfigured) {
      return optimisticEntry;
    }

    try {
      const { data: created, error } = await supabase
        .from(SupabaseAnniversaryRepository.TABLE)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      apiGovernance.invalidate('repo_anniversary_all');

      
      const parsed = AnniversarySchema.parse(created);
      this.cacheData([...cached, parsed]);
      return parsed;
    } catch (e) {
      this.cacheData(cached);
      console.error('[Anniversary] Remote create failed:', e);
      throw e;
    }
  }

  async update(id: string, data: UpdateAnniversaryDTO): Promise<AnniversaryEntity> {
    const cached = this.getCachedData();
    const previous = [...cached];
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: AnniversaryEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    if (!isSupabaseConfigured) {
      if (optimisticData) return optimisticData;
      throw new Error('Anniversary not found');
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseAnniversaryRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      apiGovernance.invalidate('repo_anniversary_all');

      const parsed = AnniversarySchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      this.cacheData(previous);
      console.error('[Anniversary] Remote update failed:', e);
      throw e;
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
        .from(SupabaseAnniversaryRepository.TABLE)
        .delete()
        .eq('id', id);
      if (error) throw error;
      apiGovernance.invalidate('repo_anniversary_all');

    } catch (e) {
      this.cacheData(cached);
      console.error('[Anniversary] Remote delete failed:', e);
      throw e;
    }
  }

  private getCachedData(): AnniversaryEntity[] {
    try {
      const data = localStorage.getItem(SupabaseAnniversaryRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(AnniversarySchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as AnniversaryEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: AnniversaryEntity[]): void {
    try {
      localStorage.setItem(SupabaseAnniversaryRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota or access blocked
    }
  }
}

export const anniversaryRepository = new SupabaseAnniversaryRepository();
