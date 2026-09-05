import { useState, useEffect, useCallback } from 'react';
import { MessageItemEntity } from '../schemas/message';
import { messageRepository, CreateMessageDTO, UpdateMessageDTO } from '../repositories/message/MessageRepository';

export function useMessages() {
  const [messages, setMessages] = useState<MessageItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await messageRepository.findAll();
      setMessages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = async (data: CreateMessageDTO) => {
    try {
      const newMessage = await messageRepository.create(data);
      setMessages(prev => [newMessage, ...prev].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
      return newMessage;
    } catch (err: any) {
      setError(err.message || 'Failed to add message');
      throw err;
    }
  };

  const updateMessage = async (id: string, data: UpdateMessageDTO) => {
    try {
      const updatedMessage = await messageRepository.update(id, data);
      setMessages(prev => prev.map(m => m.id === id ? updatedMessage : m));
      return updatedMessage;
    } catch (err: any) {
      setError(err.message || 'Failed to update message');
      throw err;
    }
  };

  const deleteMessage = async (id: string) => {
    try {
      await messageRepository.delete(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete message');
      throw err;
    }
  };

  return {
    messages,
    isLoading,
    error,
    addMessage,
    updateMessage,
    deleteMessage,
    refresh: fetchMessages
  };
}
