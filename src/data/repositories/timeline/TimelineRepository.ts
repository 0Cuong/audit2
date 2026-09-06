import { supabase } from '../../../lib/supabase';
import { TimelineEventEntity, TimelineEventSchema } from '../../schemas/timeline';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateTimelineDTO = Omit<TimelineEventEntity, 'id' | 'created_at'>;
export type UpdateTimelineDTO = Partial<CreateTimelineDTO>;

export type ITimelineRepository = BaseRepository<TimelineEventEntity, CreateTimelineDTO, UpdateTimelineDTO>;

export class SupabaseTimelineRepository implements ITimelineRepository {
  private static readonly TABLE = 'timeline_events';
  private static readonly STORAGE_KEY = 'cuongisme_timeline_v2';

  async findAll(): Promise<TimelineEventEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseTimelineRepository.TABLE)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(TimelineEventSchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as TimelineEventEntity[];
    } catch (e) {
      console.error('Failed to fetch timeline from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<TimelineEventEntity | null> {
    try {
      const { data, error } = await supabase
        .from(SupabaseTimelineRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = TimelineEventSchema.safeParse(data);
      return parsed.success ? parsed.data : data as TimelineEventEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateTimelineDTO): Promise<TimelineEventEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: TimelineEventEntity = { ...data, id: optimisticId };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseTimelineRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = TimelineEventSchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateTimelineDTO): Promise<TimelineEventEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: TimelineEventEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseTimelineRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = TimelineEventSchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Timeline event not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from(SupabaseTimelineRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): TimelineEventEntity[] {
    try {
      const data = localStorage.getItem(SupabaseTimelineRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(TimelineEventSchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as TimelineEventEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: TimelineEventEntity[]): void {
    try {
      localStorage.setItem(SupabaseTimelineRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }
}

export const timelineRepository = new SupabaseTimelineRepository();
