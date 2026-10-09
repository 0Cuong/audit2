import { useState, useEffect, useCallback } from 'react';
import { MoodEntryEntity } from '../schemas/mood';
import { moodRepository, CreateMoodDTO, UpdateMoodDTO } from '../repositories/mood/MoodRepository';

export function useMoods() {
  const [moods, setMoods] = useState<MoodEntryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMoods = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await moodRepository.findAll();
      setMoods(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch moods');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  const addMood = async (data: CreateMoodDTO) => {
    try {
      const newMood = await moodRepository.create(data);
      setMoods(prev => [newMood, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      return newMood;
    } catch (err: any) {
      setError(err.message || 'Failed to add mood');
      throw err;
    }
  };

  const updateMood = async (id: string, data: UpdateMoodDTO) => {
    try {
      const updatedMood = await moodRepository.update(id, data);
      setMoods(prev => prev.map(m => m.id === id ? updatedMood : m));
      return updatedMood;
    } catch (err: any) {
      setError(err.message || 'Failed to update mood');
      throw err;
    }
  };

  const deleteMood = async (id: string) => {
    try {
      await moodRepository.delete(id);
      setMoods(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete mood');
      throw err;
    }
  };

  return {
    moods,
    isLoading,
    error,
    addMood,
    updateMood,
    deleteMood,
    refresh: fetchMoods
  };
}
