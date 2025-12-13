import { useState } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/axios';
import type { User, LoginResponse } from '@/types';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout: storeLogout } = useStore();

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });
      const { user, token } = response;
      storeLogin(user, token);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<LoginResponse>('/auth/register', { name, email, password });
      const { user, token } = response;
      storeLogin(user, token);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors, clear local state anyway
    } finally {
      storeLogout();
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.patch<{ user: User }>('/auth/profile', data);
      useStore.getState().updateUser(response.user);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    updateProfile,
    isLoading,
    error,
  };
}
