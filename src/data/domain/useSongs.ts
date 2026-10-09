import { useState, useEffect, useCallback } from 'react';
import { SongItemEntity } from '../schemas/song';
import { songRepository, CreateSongDTO, UpdateSongDTO } from '../repositories/song/SongRepository';

export function useSongs() {
  const [songs, setSongs] = useState<SongItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await songRepository.findAll();
      setSongs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch songs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const addSong = async (data: CreateSongDTO) => {
    try {
      const newSong = await songRepository.create(data);
      setSongs(prev => [newSong, ...prev].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
      return newSong;
    } catch (err: any) {
      setError(err.message || 'Failed to add song');
      throw err;
    }
  };

  const updateSong = async (id: string, data: UpdateSongDTO) => {
    try {
      const updatedSong = await songRepository.update(id, data);
      setSongs(prev => prev.map(m => m.id === id ? updatedSong : m));
      return updatedSong;
    } catch (err: any) {
      setError(err.message || 'Failed to update song');
      throw err;
    }
  };

  const deleteSong = async (id: string) => {
    try {
      await songRepository.delete(id);
      setSongs(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete song');
      throw err;
    }
  };

  return {
    songs,
    isLoading,
    error,
    addSong,
    updateSong,
    deleteSong,
    refresh: fetchSongs
  };
}
