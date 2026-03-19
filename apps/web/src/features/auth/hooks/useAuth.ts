import { useState } from 'react';
import * as authService from '@/services/authService';
import { useStore } from '@/lib/store';
import type { User } from '@/types';
import type { SignupPayload } from '@/features/auth/utils/auth.helpers';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout: storeLogout } = useStore();

  const signin = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, access_token } = await authService.signin(email, password);
      // Set isAuthenticated immediately, store user (fallback if needed)
      storeLogin(user, access_token);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign in failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: SignupPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, access_token } = await authService.signup(payload);
      storeLogin(user, access_token);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Sign up failed. Please try again.';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signinWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, access_token } = await authService.signinWithGooglePopup();
      storeLogin(user, access_token);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signout();
    } catch (err) {
      console.error('Sign out error:', err);
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
        storeLogin(session.user, session.access_token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Session check error:', err);
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.verifyEmail(token);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email verification failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.resetPassword(password);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signin,
    signinWithGoogle,
    signup,
    signout,
    updateProfile,
    checkSession,
    forgotPassword,
    verifyEmail,
    resetPassword,
    isLoading,
    error,
  };
}