import { useState } from 'react';
import { useStore } from '@/lib/store';
import * as authService from '@/services/authService';
import type { User } from '@/types';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout: storeLogout } = useStore();

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, token } = await authService.login(email, password);
      storeLogin(user, token);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Split name into firstName and lastName if provided
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { user, token } = await authService.register(email, password, name, firstName, lastName);
      storeLogin(user, token);
      return true;
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with logout anyway
    } finally {
      storeLogout();
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateProfile(data);
      useStore.getState().updateUser(updatedUser);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async (): Promise<boolean> => {
    try {
      const session = await authService.checkSession();
      if (session) {
        storeLogin(session.user, session.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Session check error:', err);
      return false;
    }
  };

  return {
    login,
    register,
    logout,
    updateProfile,
    checkSession,
    isLoading,
    error,
  };
}
