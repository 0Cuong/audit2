import { supabase } from '../../../lib/supabase';
import { MessageItemEntity, MessageItemSchema } from '../../schemas/message';
import { BaseRepository } from '../core/BaseRepository';
import { z } from 'zod';

export type CreateMessageDTO = Omit<MessageItemEntity, 'id' | 'created_at'>;
export type UpdateMessageDTO = Partial<CreateMessageDTO>;

export type IMessageRepository = BaseRepository<MessageItemEntity, CreateMessageDTO, UpdateMessageDTO>;

export class SupabaseMessageRepository implements IMessageRepository {
  private static readonly TABLE = 'messages';
  private static readonly STORAGE_KEY = 'cuongisme_hub_v2';

  async findAll(): Promise<MessageItemEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseMessageRepository.TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      const parsed = z.array(MessageItemSchema).safeParse(data);
      if (parsed.success) {
        this.cacheData(parsed.data);
        return parsed.data;
      }
      return data as MessageItemEntity[];
    } catch (e) {
      console.error('Failed to fetch messages from Supabase, falling back to cache:', e);
      return this.getCachedData();
    }
  }

  async findById(id: string): Promise<MessageItemEntity | null> {
    try {
      const { data, error } = await supabase
        .from(SupabaseMessageRepository.TABLE)
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      const parsed = MessageItemSchema.safeParse(data);
      return parsed.success ? parsed.data : data as MessageItemEntity;
    } catch (e) {
      const cached = this.getCachedData();
      return cached.find(m => m.id === id) || null;
    }
  }

  async create(data: CreateMessageDTO): Promise<MessageItemEntity> {
    const optimisticId = `local-${Date.now()}`;
    const optimisticEntry: MessageItemEntity = { 
      ...data, 
      id: optimisticId,
      created_at: new Date().toISOString()
    };
    
    const cached = this.getCachedData();
    this.cacheData([optimisticEntry, ...cached]);

    try {
      const { data: created, error } = await supabase
        .from(SupabaseMessageRepository.TABLE)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      const parsed = MessageItemSchema.parse(created);
      this.cacheData([parsed, ...cached]);
      return parsed;
    } catch (e) {
      return optimisticEntry;
    }
  }

  async update(id: string, data: UpdateMessageDTO): Promise<MessageItemEntity> {
    const cached = this.getCachedData();
    const existingIndex = cached.findIndex(m => m.id === id);
    let optimisticData: MessageItemEntity | null = null;
    
    if (existingIndex >= 0) {
      optimisticData = { ...cached[existingIndex], ...data };
      cached[existingIndex] = optimisticData;
      this.cacheData([...cached]);
    }

    try {
      const { data: updated, error } = await supabase
        .from(SupabaseMessageRepository.TABLE)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const parsed = MessageItemSchema.parse(updated);
      
      if (existingIndex >= 0) {
        cached[existingIndex] = parsed;
        this.cacheData([...cached]);
      }
      return parsed;
    } catch (e) {
      if (optimisticData) return optimisticData;
      throw new Error('Message entry not found');
    }
  }

  async delete(id: string): Promise<void> {
    const cached = this.getCachedData();
    this.cacheData(cached.filter(m => m.id !== id));

    try {
      const { error } = await supabase
        .from(SupabaseMessageRepository.TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete from Supabase, deleted locally only', e);
    }
  }

  private getCachedData(): MessageItemEntity[] {
    try {
      const data = localStorage.getItem(SupabaseMessageRepository.STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      const validated = z.array(MessageItemSchema).safeParse(parsed);
      if (validated.success) return validated.data;
      return parsed as MessageItemEntity[];
    } catch {
      return [];
    }
  }

  private cacheData(data: MessageItemEntity[]): void {
    try {
      localStorage.setItem(SupabaseMessageRepository.STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }
}

export const messageRepository = new SupabaseMessageRepository();
