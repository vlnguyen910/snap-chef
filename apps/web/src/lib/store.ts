import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState } from '@/types';

interface AppState extends AuthState {
  // Initialization state
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
  
  // Auth actions
  login: (user: User, token: string) => void;
  logout: () => void;
  signout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,

      // Initialization action
      setInitialized: (value) => set({ isInitialized: value }),

      // Actions
      login: (user, token) => {
        localStorage.setItem('authToken', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, isAuthenticated: false });
      },

      signout: function() {
        this.logout();
      },

      updateUser: (userData) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'snap-chef-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        // Called when hydration is complete
        if (error) {
          console.error('Error hydrating store:', error);
          // Set initialized anyway to prevent infinite loading
          state?.setInitialized(true);
        } else {
          state?.setInitialized(true);
        }
      },
    }
  )
);

// Ensure initialization happens even if hydration fails
if (typeof window !== 'undefined') {
  // Set a timeout fallback in case hydration takes too long
  setTimeout(() => {
    const state = useStore.getState();
    if (!state.isInitialized) {
      console.warn('Store hydration timeout - initializing anyway');
      state.setInitialized(true);
    }
  }, 1000);
}
