import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastContext, type Toast as ToastType } from '@/context/ToastContext';

const variantStyles: Record<ToastType['variant'], string> = {
  success: 'bg-success-bg border-success text-success',
  error:   'bg-danger-bg border-danger text-danger',
  warning: 'bg-warning-bg border-warning text-warning',
  info:    'bg-primark-blue-light border-primark-blue text-primark-blue-dark',
};

const variantIcons: Record<ToastType['variant'], React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error:   <AlertCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info size={18} />,
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToastContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'flex items-center gap-3 w-full max-w-sm px-4 py-3 rounded-xl border shadow-md pointer-events-auto',
            variantStyles[toast.variant],
          ].join(' ')}
        >
          <span className="shrink-0">{variantIcons[toast.variant]}</span>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
