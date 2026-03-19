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

const GOOGLE_POPUP_NAME = 'snapchef-google-auth-popup';
const GOOGLE_POPUP_WIDTH = 520;
const GOOGLE_POPUP_HEIGHT = 680;
const GOOGLE_AUTH_TIMEOUT_MS = 120_000;

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

function getGoogleAuthUrl(): string {
  const customGoogleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL as
    | string
    | undefined;

  if (customGoogleAuthUrl) {
    return customGoogleAuthUrl;
  }

  const apiBaseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    'http://localhost:8080/api';

  return `${apiBaseUrl.replace(/\/$/, '')}/auth/google`;
}

function openCenteredPopup(url: string): Window | null {
  const left = window.screenX + (window.outerWidth - GOOGLE_POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - GOOGLE_POPUP_HEIGHT) / 2;

  return window.open(
    url,
    GOOGLE_POPUP_NAME,
    [
      'popup=yes',
      `width=${GOOGLE_POPUP_WIDTH}`,
      `height=${GOOGLE_POPUP_HEIGHT}`,
      `left=${Math.round(left)}`,
      `top=${Math.round(top)}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(',')
  );
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== 'object') return false;

  const data = value as Record<string, unknown>;
  const user = data.user as Record<string, unknown> | undefined;

  return Boolean(
    user &&
      typeof data.access_token === 'string' &&
      typeof user.id === 'string' &&
      typeof user.email === 'string'
  );
}

function tryParsePopupResponse(popup: Window): AuthResponse | null {
  try {
    const rawText = popup.document.body?.textContent?.trim();
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    if (!isAuthResponse(parsed)) return null;

    return {
      ...parsed,
      user: transformUser(parsed.user),
    };
  } catch {
    return null;
  }
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

export async function signinWithGooglePopup(): Promise<AuthResponse> {
  const authUrl = getGoogleAuthUrl();
  const popup = openCenteredPopup(authUrl);

  if (!popup) {
    throw new Error('Popup was blocked. Please allow popups and try again.');
  }

  popup.focus();

  return new Promise<AuthResponse>((resolve, reject) => {
    let isCompleted = false;

    const finish = (handler: () => void) => {
      if (isCompleted) return;
      isCompleted = true;

      window.removeEventListener('message', onMessage);
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      handler();
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      if (!event.data || typeof event.data !== 'object') return;

      const payload = event.data as Record<string, unknown>;
      if (payload.type !== 'SNAPCHEF_GOOGLE_AUTH_SUCCESS') return;

      const response = payload.payload;
      if (!isAuthResponse(response)) {
        finish(() => reject(new Error('Google authentication response is invalid.')));
        return;
      }

      if (!popup.closed) popup.close();
      finish(() =>
        resolve({
          ...response,
          user: transformUser(response.user),
        })
      );
    };

    window.addEventListener('message', onMessage);

    const pollId = window.setInterval(() => {
      if (popup.closed) {
        finish(() => reject(new Error('Google sign in was cancelled.')));
        return;
      }

      const parsedResponse = tryParsePopupResponse(popup);
      if (!parsedResponse) return;

      localStorage.setItem('authToken', parsedResponse.access_token);
      popup.close();
      finish(() => resolve(parsedResponse));
    }, 400);

    const timeoutId = window.setTimeout(() => {
      try {
        if (!popup.closed) popup.close();
      } catch {
        // ignore
      }

      finish(() =>
        reject(new Error('Google sign in timed out. Please try again.'))
      );
    }, GOOGLE_AUTH_TIMEOUT_MS);
  });
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

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return await api.post('/auth/forget-password', { email });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return await api.get('/auth/verify-email', { params: { token } });
}

export async function resetPassword(password: string): Promise<{ message: string }> {
  // reset-password in the controller uses JwtAuthGuard, so it needs the token in headers
  // The token is usually sent as a Bearer token after clicking the email link
  return await api.post('/auth/reset-password', { password });
}