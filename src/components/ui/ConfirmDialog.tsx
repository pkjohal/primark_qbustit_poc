interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div
        className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <h2 className="text-lg font-bold text-navy mb-2">{title}</h2>
        <p className="text-sm text-mid-grey mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-border-grey text-charcoal font-medium text-sm hover:bg-light-grey transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={[
              'flex-1 py-3 rounded-lg font-semibold text-sm transition-colors',
              variant === 'danger'
                ? 'bg-danger text-white hover:bg-red-600'
                : 'bg-primark-blue text-white hover:bg-primark-blue-dark',
            ].join(' ')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
