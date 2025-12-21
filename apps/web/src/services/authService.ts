import { api } from '@/lib/axios';
import type { User } from '@/types';
// 👇 Import cả hàm xử lý tên và Type Payload từ helper
import { splitFullName } from '@/features/auth/utils/auth.helpers';
import type { SignupPayload } from '@/features/auth/utils/auth.helpers'; 

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
}

// --- Helpers ---
function decodeToken(token: string): Record<string, any> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('Failed to decode token:', error);
    return {};
  }
}

function transformUser(data: any): User {
  let finalFirstName = data.firstName || data.first_name;
  let finalLastName = data.lastName || data.last_name;

  // Logic tách tên nếu backend trả về full name (dùng hàm từ helper)
  if (!finalFirstName || !finalLastName) {
    const rawName = data.name || data.full_name || data.fullName;
    if (rawName) {
      const split = splitFullName(rawName); // ✅ Dùng hàm import
      if (!finalFirstName) finalFirstName = split.firstName;
      if (!finalLastName) finalLastName = split.lastName;
    }
  }

  // Fallback
  if (!finalFirstName) {
    finalFirstName = data.username || data.email?.split('@')[0] || 'User';
    finalLastName = '';
  }

  return {
    id: data.id || data.sub || 'temp-id',
    email: data.email || '',
    username: data.username || data.email?.split('@')[0] || 'user',
    firstName: finalFirstName,
    lastName: finalLastName || '',
    role: data.role?.toLowerCase() || 'user',
    avatar: data.avatar || data.avatar_url || undefined,
    bio: data.bio || undefined,
    createdAt: data.createdAt || data.create_at || data.created_at || new Date().toISOString(),
  };
}

// --- Main Functions ---

export async function signin(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<any>('/auth/login', { email, password });

  if (response.access_token) {
    localStorage.setItem('authToken', response.access_token);
  }

  const decodedToken = decodeToken(response.access_token);
  const rawUserData = { ...decodedToken, ...(response.user || {}), email }; 

  return {
    user: transformUser(rawUserData),
    access_token: response.access_token,
    refresh_token: response.refresh_token,
  };
}

/**
 * Sign up
 * ✅ Sử dụng SignupPayload được import từ auth.helpers
 */
export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const response = await api.post<any>('/auth/sign-up', payload);

  if (response.access_token) {
    localStorage.setItem('authToken', response.access_token);
  }

  const decodedToken = decodeToken(response.access_token);

  // Merge dữ liệu
  const rawUserData = { 
    ...decodedToken, 
    email: payload.email, 
    username: payload.username,
    firstName: payload.firstName, 
    lastName: payload.lastName 
  };

  return {
    user: transformUser(rawUserData),
    access_token: response.access_token,
    refresh_token: response.refresh_token,
  };
}

export async function signout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {}
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

export async function checkSession(): Promise<AuthResponse | null> {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const userResponse = await api.get<any>('/auth/profile');
    return {
      user: transformUser(userResponse),
      access_token: token,
    };
  } catch (error) {
    localStorage.removeItem('authToken');
    return null;
  }
}

export async function updateProfile(updates: Partial<User>): Promise<User> {
  const response = await api.patch<any>('/auth/profile', updates);
  return transformUser(response);
}