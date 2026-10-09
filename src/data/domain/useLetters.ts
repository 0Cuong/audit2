import { useState, useEffect, useCallback } from 'react';
import { LoveLetterEntity } from '../schemas/letter';
import { letterRepository, CreateLetterDTO, UpdateLetterDTO } from '../repositories/letter/LetterRepository';

export function useLetters() {
  const [letters, setLetters] = useState<LoveLetterEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLetters = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await letterRepository.findAll();
      setLetters(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch letters');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const addLetter = async (data: CreateLetterDTO) => {
    try {
      const newLetter = await letterRepository.create(data);
      setLetters(prev => [newLetter, ...prev].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
      return newLetter;
    } catch (err: any) {
      setError(err.message || 'Failed to add letter');
      throw err;
    }
  };

  const updateLetter = async (id: string, data: UpdateLetterDTO) => {
    try {
      const updatedLetter = await letterRepository.update(id, data);
      setLetters(prev => prev.map(m => m.id === id ? updatedLetter : m));
      return updatedLetter;
    } catch (err: any) {
      setError(err.message || 'Failed to update letter');
      throw err;
    }
  };

  const deleteLetter = async (id: string) => {
    try {
      await letterRepository.delete(id);
      setLetters(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete letter');
      throw err;
    }
  };

  return {
    letters,
    isLoading,
    error,
    addLetter,
    updateLetter,
    deleteLetter,
    refresh: fetchLetters
  };
}
