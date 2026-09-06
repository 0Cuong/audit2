import { supabase } from '../../../lib/supabase';
import { SongItemEntity, SongItemSchema } from '../../schemas/song';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateSongDTO = Omit<SongItemEntity, 'id' | 'created_at'>;
export type UpdateSongDTO = Partial<CreateSongDTO>;

export type ISongRepository = BaseRepository<SongItemEntity, CreateSongDTO, UpdateSongDTO>;

export class SupabaseSongRepository implements ISongRepository {
  private static readonly TABLE = 'songs';
  private static readonly STORAGE_KEY = 'cuongisme_music_v2';

  async findAll(): Promise<SongItemEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseSongRepository.TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(SongItemSchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as SongItemEntity[];
    } catch (e) {
      console.error('Failed to fetch songs from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<SongItemEntity | null> {
    try {
      const { data, error } = await supabase
        .from(SupabaseSongRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = SongItemSchema.safeParse(data);
      return parsed.success ? parsed.data : data as SongItemEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateSongDTO): Promise<SongItemEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: SongItemEntity = { 
      ...data, 
      id: optimisticId,
      created_at: new Date().toISOString()
    };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseSongRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = SongItemSchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateSongDTO): Promise<SongItemEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: SongItemEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseSongRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = SongItemSchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Song entry not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from(SupabaseSongRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): SongItemEntity[] {
    try {
      const data = localStorage.getItem(SupabaseSongRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(SongItemSchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as SongItemEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: SongItemEntity[]): void {
    try {
      localStorage.setItem(SupabaseSongRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }
}

export const songRepository = new SupabaseSongRepository();
