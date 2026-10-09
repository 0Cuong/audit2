import { useState, useEffect, useCallback } from 'react';
import { JournalEntryEntity } from '../schemas/journal';
import { journalRepository, CreateJournalDTO, UpdateJournalDTO } from '../repositories/journal/JournalRepository';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntryEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await journalRepository.findAll();
      setEntries(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch journal entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addEntry = async (data: CreateJournalDTO) => {
    try {
      const newEntry = await journalRepository.create(data);
      setEntries(prev => [newEntry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      return newEntry;
    } catch (err: any) {
      setError(err.message || 'Failed to add entry');
      throw err;
    }
  };

  const updateEntry = async (id: string, data: UpdateJournalDTO) => {
    try {
      const updatedEntry = await journalRepository.update(id, data);
      setEntries(prev => prev.map(m => m.id === id ? updatedEntry : m));
      return updatedEntry;
    } catch (err: any) {
      setError(err.message || 'Failed to update entry');
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await journalRepository.delete(id);
      setEntries(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
      throw err;
    }
  };

  return {
    entries,
    isLoading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: fetchEntries
  };
}
