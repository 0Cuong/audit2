import { supabase } from '../../../lib/supabase';
import { JournalEntryEntity, JournalEntrySchema } from '../../schemas/journal';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateJournalDTO = Omit<JournalEntryEntity, 'id' | 'created_at'>;
export type UpdateJournalDTO = Partial<CreateJournalDTO>;

export type IJournalRepository = BaseRepository<JournalEntryEntity, CreateJournalDTO, UpdateJournalDTO>;

export class SupabaseJournalRepository implements IJournalRepository {
  private static readonly TABLE = 'journal_entries';
  private static readonly STORAGE_KEY = 'cuongisme_journal_v2';

  async findAll(): Promise<JournalEntryEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseJournalRepository.TABLE)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(JournalEntrySchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as JournalEntryEntity[];
    } catch (e) {
      console.error('Failed to fetch journals from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<JournalEntryEntity | null> {
    try {
      const { data, error } = await supabase
        .from(SupabaseJournalRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = JournalEntrySchema.safeParse(data);
      return parsed.success ? parsed.data : data as JournalEntryEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateJournalDTO): Promise<JournalEntryEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: JournalEntryEntity = { ...data, id: optimisticId };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseJournalRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = JournalEntrySchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateJournalDTO): Promise<JournalEntryEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: JournalEntryEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseJournalRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = JournalEntrySchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Journal entry not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from(SupabaseJournalRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): JournalEntryEntity[] {
    try {
      const data = localStorage.getItem(SupabaseJournalRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(JournalEntrySchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as JournalEntryEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: JournalEntryEntity[]): void {
    try {
      localStorage.setItem(SupabaseJournalRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }
}

export const journalRepository = new SupabaseJournalRepository();
