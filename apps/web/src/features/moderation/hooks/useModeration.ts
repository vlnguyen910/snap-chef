import { useState } from 'react';
import { api } from '@/lib/axios';
import type { ModerationQueue } from '@/types';

export function useModeration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async (): Promise<ModerationQueue[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: ModerationQueue[] }>('/moderation/queue');
      return response.data.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch moderation queue');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const approveRecipe = async (queueItemId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/moderation/queue/${queueItemId}/approve`);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve recipe');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRecipe = async (queueItemId: string, reason: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post(`/moderation/queue/${queueItemId}/reject`, { reason });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject recipe');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/moderation/stats');
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchQueue,
    approveRecipe,
    rejectRecipe,
    fetchStats,
    isLoading,
    error,
  };
}
