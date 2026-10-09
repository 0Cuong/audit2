import { useState, useEffect, useCallback } from 'react';
import { BucketItemEntity } from '../schemas/bucket';
import { bucketRepository, CreateBucketDTO, UpdateBucketDTO } from '../repositories/bucket/BucketRepository';

export function useBucket() {
  const [items, setItems] = useState<BucketItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await bucketRepository.findAll();
      setItems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bucket items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (data: CreateBucketDTO) => {
    try {
      const newItem = await bucketRepository.create(data);
      setItems(prev => [newItem, ...prev].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
      return newItem;
    } catch (err: any) {
      setError(err.message || 'Failed to add bucket item');
      throw err;
    }
  };

  const updateItem = async (id: string, data: UpdateBucketDTO) => {
    try {
      const updatedItem = await bucketRepository.update(id, data);
      setItems(prev => prev.map(m => m.id === id ? updatedItem : m));
      return updatedItem;
    } catch (err: any) {
      setError(err.message || 'Failed to update bucket item');
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await bucketRepository.delete(id);
      setItems(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete bucket item');
      throw err;
    }
  };

  return {
    items,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refresh: fetchItems
  };
}
