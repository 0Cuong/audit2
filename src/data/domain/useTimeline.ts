import { useState, useEffect, useCallback } from 'react';
import { TimelineEventEntity } from '../schemas/timeline';
import { timelineRepository, CreateTimelineDTO, UpdateTimelineDTO } from '../repositories/timeline/TimelineRepository';

export function useTimeline() {
  const [events, setEvents] = useState<TimelineEventEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await timelineRepository.findAll();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch timeline events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (data: CreateTimelineDTO) => {
    try {
      const newEvent = await timelineRepository.create(data);
      setEvents(prev => [newEvent, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      return newEvent;
    } catch (err: any) {
      setError(err.message || 'Failed to add event');
      throw err;
    }
  };

  const updateEvent = async (id: string, data: UpdateTimelineDTO) => {
    try {
      const updatedEvent = await timelineRepository.update(id, data);
      setEvents(prev => prev.map(m => m.id === id ? updatedEvent : m));
      return updatedEvent;
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await timelineRepository.delete(id);
      setEvents(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      throw err;
    }
  };

  return {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refresh: fetchEvents
  };
}
