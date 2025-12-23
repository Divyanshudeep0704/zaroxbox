import { useEffect } from 'react';
import { CheckCircle, X, Loader, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  darkMode: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, darkMode, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    if (darkMode) return 'bg-slate-800 border-slate-700';
    return 'bg-white border-gray-200';
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 ${getBgColor()} border rounded-xl shadow-lg p-4 flex items-center gap-3 animate-slideUp`}
    >
      {getIcon()}
      <span className={`flex-1 text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        {message}
      </span>
      {type !== 'loading' && (
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${
            darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  darkMode: boolean;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, darkMode, onRemove }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ bottom: `${4 + index * 80}px` }}
          className="fixed left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            darkMode={darkMode}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </>
  );
}
