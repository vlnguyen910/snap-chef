import useToastStore from '@/lib/toast-store';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const styles = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
};

export function Toaster() {
  const { toasts, dismissToast } = useToastStore();
  const [isMounted, setIsMounted] = useState(false);

  // Hydration fix (đảm bảo chỉ render ở client)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            flex items-center gap-3 p-4 rounded-lg border shadow-lg 
            transition-all duration-300 animate-in slide-in-from-right-full
            ${styles[t.type]}
          `}
        >
          {/* Icon */}
          <div className="flex-shrink-0">{icons[t.type]}</div>
          
          {/* Message */}
          <p className="text-sm font-medium flex-1">{t.message}</p>
          
          {/* Action Button (if exists) */}
          {t.action && (
            <button
              onClick={() => {
                t.action?.onClick();
                dismissToast(t.id);
              }}
              className="px-3 py-1 text-sm font-medium bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
            >
              {t.action.label}
            </button>
          )}
          
          {/* Close Button */}
          <button
            onClick={() => dismissToast(t.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}