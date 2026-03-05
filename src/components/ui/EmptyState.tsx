import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ icon, message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-mid-grey mb-3 opacity-40">{icon}</div>
      <p className="text-mid-grey text-sm">{message}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-4 px-4 py-2 bg-primark-blue text-white rounded-lg text-sm font-medium"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
