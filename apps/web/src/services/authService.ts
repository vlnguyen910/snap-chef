import { supabase } from '@/lib/supabase';
import { api, IS_SUPABASE } from '@/lib/api'; // Giả sử 'api' là một Axios Instance
import type { User } from '@/types';

// Normalized response type
export interface AuthResponse {
  user: User;
  token: string;
}

// --- HELPER FUNCTION ---
/**
 * Chuyển đổi dữ liệu thô từ Supabase thành chuẩn User của app
 * Giúp tránh lặp code ở login, register và checkSession
 */
const normalizeSupabaseUser = (authUser: any, profile: any): User => {
  return {
    id: authUser.id,
    email: authUser.email!,
    username: profile?.username || authUser.email!.split('@')[0],
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    role: profile?.role || 'user',
    avatar: profile?.avatar_url || undefined,
    bio: profile?.bio || undefined,
    createdAt: profile?.created_at || authUser.created_at,
  };
};

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  if (IS_SUPABASE) {
    // 1. Supabase Logic
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user || !data.session) throw new Error('No user data returned from Supabase');

    // Fetch profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return {
      user: normalizeSupabaseUser(data.user, profile),
      token: data.session.access_token,
    };

  } else {
    // 2. REST API Logic (Axios)
    // Sử dụng Generic Type <AuthResponse> để TypeScript hiểu kiểu dữ liệu trả về
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    
    // Axios luôn bọc dữ liệu trong .data
    return response.data; 
  }
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
  if (IS_SUPABASE) {
    // 1. Supabase Logic
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No user data returned from Supabase');

    // Create profile
    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email!,
      username: username || email.split('@')[0],
      first_name: firstName,
      last_name: lastName,
      role: 'user',
    });

    // Reuse helper logic (profile is inferred from inputs for now)
    const tempProfile = {
      username,
      first_name: firstName,
      last_name: lastName,
      role: 'user',
      created_at: new Date().toISOString()
    };

    return {
      user: normalizeSupabaseUser(data.user, tempProfile),
      token: data.session?.access_token || '',
    };

  } else {
    // 2. REST API Logic
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      username,
      firstName,
      lastName,
    });

    return response.data;
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  if (IS_SUPABASE) {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Supabase logout error:', error);
  } else {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('API logout error:', error);
    }
  }

  // Clear local storage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Check for existing session
 */
export async function checkSession(): Promise<AuthResponse | null> {
  if (IS_SUPABASE) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      user: normalizeSupabaseUser(session.user, profile),
      token: session.access_token,
    };
  } 
  
  // REST API Logic
  // Kiểm tra localStorage (Lưu ý: Tốt hơn nên gọi API /auth/me để verify token nếu backend hỗ trợ)
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr) as User;
      return { user, token };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Update user profile
 */
export async function updateProfile(updates: Partial<User>): Promise<User> {
  if (IS_SUPABASE) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update({
        username: updates.username,
        first_name: updates.firstName,
        last_name: updates.lastName,
        bio: updates.bio,
        avatar_url: updates.avatar,
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Chuẩn hóa lại object trả về từ Supabase DB cho khớp với User type
    return normalizeSupabaseUser(authUser, data);

  } else {
    // REST API Logic
    // API trả về object có dạng { user: User } hoặc trực tiếp User tùy backend
    // Giả sử backend trả về { user: User }
    const response = await api.patch<{ user: User }>('/auth/profile', updates);
    return response.data.user;
  }
}