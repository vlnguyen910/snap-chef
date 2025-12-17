import { api } from '@/lib/axios';
import type { User } from '@/types';

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<{ user: any; token: string }>('/auth/login', { 
    email, 
    password 
  });
  
  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }
  
  return {
    user: normalizeUser(response.user),
    token: response.token,
  };
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  username?: string,
  firstName?: string,
  lastName?: string
): Promise<AuthResponse> {
  const response = await api.post<{ user: any; token: string }>('/auth/register', {
    email,
    password,
    username,
    firstName,
    lastName,
  });

  if (response.token) {
    localStorage.setItem('authToken', response.token);
  }

  return {
    user: normalizeUser(response.user),
    token: response.token,
  };
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('API logout error:', error);
  }

  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

/**
 * Check for existing session
 */
export async function checkSession(): Promise<AuthResponse | null> {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return null;
  }

  try {
    const response = await api.get<{ user: any; token: string }>('/auth/me');
    return {
      user: normalizeUser(response.user),
      token: response.token || token,
    };
  } catch (error) {
    localStorage.removeItem('authToken');
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: Partial<User>): Promise<User> {
  const response = await api.patch<{ user: any }>('/auth/profile', {
    username: updates.username,
    firstName: updates.firstName,
    lastName: updates.lastName,
    bio: updates.bio,
    avatar: updates.avatar,
  });

  return normalizeUser(response.user);
}

// Helper function to normalize user data from backend
function normalizeUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    username: data.username || data.email.split('@')[0],
    firstName: data.firstName || data.first_name || '',
    lastName: data.lastName || data.last_name || '',
    role: data.role || 'user',
    avatar: data.avatar || data.avatar_url || undefined,
    bio: data.bio || undefined,
    createdAt: data.createdAt || data.create_at,
  };
}