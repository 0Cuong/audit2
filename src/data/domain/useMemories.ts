import { useState, useEffect, useCallback } from 'react';
import { MemoryEntity } from '../schemas/memory';
import { memoryRepository, CreateMemoryDTO, UpdateMemoryDTO } from '../repositories/memory/MemoryRepository';

export function useMemories() {
  const [memories, setMemories] = useState<MemoryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await memoryRepository.findAll();
      setMemories(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch memories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const addMemory = async (data: CreateMemoryDTO) => {
    try {
      const newMemory = await memoryRepository.create(data);
      setMemories(prev => [newMemory, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      return newMemory;
    } catch (err: any) {
      setError(err.message || 'Failed to add memory');
      throw err;
    }
  };

  const updateMemory = async (id: string, data: UpdateMemoryDTO) => {
    try {
      const updatedMemory = await memoryRepository.update(id, data);
      setMemories(prev => prev.map(m => m.id === id ? updatedMemory : m));
      return updatedMemory;
    } catch (err: any) {
      setError(err.message || 'Failed to update memory');
      throw err;
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await memoryRepository.delete(id);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete memory');
      throw err;
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    return updateMemory(id, { is_favorite: !currentStatus });
  };

  const togglePin = async (id: string, currentStatus: boolean) => {
    return updateMemory(id, { is_pinned: !currentStatus });
  };

  return {
    memories,
    isLoading,
    error,
    addMemory,
    updateMemory,
    deleteMemory,
    toggleFavorite,
    togglePin,
    refresh: fetchMemories
  };
}
