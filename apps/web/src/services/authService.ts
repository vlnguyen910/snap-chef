import { api } from '@/lib/axios';
import type { User } from '@/types';
import type { SignupPayload } from '@/utils/auth.helpers';

// Utility function to decode JWT token
function decodeToken(token: string): Record<string, any> {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    
    // Decode payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return {};
  }
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

/**
 * Sign in with email and password
 */
export async function signin(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<{ access_token: string; refresh_token: string; user?: User }>('/auth/login', { 
    email, 
    password 
  });

  if (response.access_token) {
    localStorage.setItem('authToken', response.access_token);
  }

  // Decode token to extract user info
  const decodedToken = decodeToken(response.access_token);

  // Use user from response if available, otherwise extract from token or fallback
  let user: User;
  if (response.user) {
    user = response.user;
  } else {
    // Extract user info from token
    const tokenName = decodedToken.name || 
                     decodedToken.fullName || 
                     decodedToken.firstName || 
                     decodedToken.username ||
                     email.split('@')[0]; // Fallback to email prefix
    
    user = {
      id: decodedToken.sub || decodedToken.id || 'temp',
      name: tokenName,
      email: email,
      username: decodedToken.username || email.split('@')[0],
    };
  }

  return {
    user,
    access_token: response.access_token,
    refresh_token: response.refresh_token,
  };
}

/**
 * Sign up a new user
 * Uses transformed payload from auth.helpers
 */
export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const response = await api.post<{ access_token: string; refresh_token: string }>('/auth/sign-up', payload);

  if (response.access_token) {
    localStorage.setItem('authToken', response.access_token);
  }

  // Decode token to extract user info
  const decodedToken = decodeToken(response.access_token);

  // Build user object from decoded token or payload
  const user: User = {
    id: decodedToken.sub || decodedToken.id || 'temp',
    name: decodedToken.name || 
          decodedToken.fullName || 
          payload.firstName || 
          decodedToken.username || 
          payload.email.split('@')[0],
    email: payload.email,
    username: decodedToken.username || payload.username,
  };

  return {
    user,
    access_token: response.access_token,
    refresh_token: response.refresh_token,
  };
}

/**
 * Sign out current user
 */
export async function signout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('API signout error:', error);
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
    const userResponse = await api.get<any>('/auth/profile');
    return {
      user: normalizeUser(userResponse),
      access_token: token,
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
  const response = await api.patch<any>('/auth/profile', {
    username: updates.username,
    bio: updates.bio,
    avatar_url: updates.avatar,
  });

  return normalizeUser(response);
}

// Helper function to normalize user data from backend
function normalizeUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    username: data.username,
    firstName: '', // Backend doesn't have these fields
    lastName: '',  // We can parse username if needed
    role: data.role?.toLowerCase() || 'user',
    avatar: data.avatar_url || undefined,
    bio: data.bio || undefined,
    createdAt: data.create_at || new Date().toISOString(),
  };
}