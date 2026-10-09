import { useState, useEffect, useCallback } from 'react';
import { GiftItemEntity } from '../schemas/gift';
import { giftRepository, CreateGiftDTO, UpdateGiftDTO } from '../repositories/gift/GiftRepository';

export function useGifts() {
  const [gifts, setGifts] = useState<GiftItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await giftRepository.findAll();
      setGifts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch gifts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const addGift = async (data: CreateGiftDTO) => {
    try {
      const newGift = await giftRepository.create(data);
      setGifts(prev => [newGift, ...prev].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
      return newGift;
    } catch (err: any) {
      setError(err.message || 'Failed to add gift');
      throw err;
    }
  };

  const updateGift = async (id: string, data: UpdateGiftDTO) => {
    try {
      const updatedGift = await giftRepository.update(id, data);
      setGifts(prev => prev.map(m => m.id === id ? updatedGift : m));
      return updatedGift;
    } catch (err: any) {
      setError(err.message || 'Failed to update gift');
      throw err;
    }
  };

  const deleteGift = async (id: string) => {
    try {
      await giftRepository.delete(id);
      setGifts(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete gift');
      throw err;
    }
  };

  return {
    gifts,
    isLoading,
    error,
    addGift,
    updateGift,
    deleteGift,
    refresh: fetchGifts
  };
}
