import { useState, useEffect, useCallback } from 'react';
import { AnniversaryEntity } from '../schemas/anniversary';
import { anniversaryRepository, CreateAnniversaryDTO, UpdateAnniversaryDTO } from '../repositories/anniversary/AnniversaryRepository';

export function useAnniversaries() {
  const [anniversaries, setAnniversaries] = useState<AnniversaryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnniversaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await anniversaryRepository.findAll();
      setAnniversaries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch anniversaries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnniversaries();
  }, [fetchAnniversaries]);

  const addAnniversary = async (data: CreateAnniversaryDTO) => {
    try {
      const newAnniversary = await anniversaryRepository.create(data);
      setAnniversaries(prev => [...prev, newAnniversary].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      return newAnniversary;
    } catch (err: any) {
      setError(err.message || 'Failed to add anniversary');
      throw err;
    }
  };

  const updateAnniversary = async (id: string, data: UpdateAnniversaryDTO) => {
    try {
      const updatedAnniversary = await anniversaryRepository.update(id, data);
      setAnniversaries(prev => prev.map(m => m.id === id ? updatedAnniversary : m));
      return updatedAnniversary;
    } catch (err: any) {
      setError(err.message || 'Failed to update anniversary');
      throw err;
    }
  };

  const deleteAnniversary = async (id: string) => {
    try {
      await anniversaryRepository.delete(id);
      setAnniversaries(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete anniversary');
      throw err;
    }
  };

  return {
    anniversaries,
    isLoading,
    error,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    refresh: fetchAnniversaries
  };
}
