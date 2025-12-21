import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number; // ✅ Custom duration
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, action?: ToastAction, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type, action, duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, message, type, action, duration }] }));

    // ✅ Only auto-dismiss if duration is not Infinity and no action button
    if (duration !== Infinity && !action) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Helper function để gọi toast ở bất cứ đâu (kể cả ngoài React Component)
export const toast = {
  success: (message: string, action?: ToastAction, duration?: number) => 
    useToastStore.getState().addToast(message, 'success', action, duration),
  error: (message: string, action?: ToastAction, duration?: number) => 
    useToastStore.getState().addToast(message, 'error', action, duration),
  info: (message: string, action?: ToastAction, duration?: number) => 
    useToastStore.getState().addToast(message, 'info', action, duration),
  warning: (message: string, action?: ToastAction, duration?: number) => 
    useToastStore.getState().addToast(message, 'warning', action, duration),
};

export default useToastStore;