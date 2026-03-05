import { useState } from 'react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  onComplete: (pin: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export default function PinPad({ onComplete, error, disabled }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  // Reset shake when error clears
  const handleDigit = (digit: string) => {
    if (disabled || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      onComplete(next);
      setTimeout(() => setPin(''), 300);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    setPin((p) => p.slice(0, -1));
  };

  // Trigger shake when error appears
  if (error && !shake) {
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 600);
  }

  return (
    <div>
      {/* PIN dot indicators */}
      <div className="flex justify-center mb-5">
        <div
          className="flex gap-4"
          style={shake ? { animation: 'shake 0.5s' } : undefined}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={[
                'w-4 h-4 rounded-full border-2 transition-all duration-150',
                i < pin.length
                  ? 'bg-navy border-navy scale-110'
                  : 'bg-transparent border-mid-grey',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            disabled={disabled}
            className="flex items-center justify-center h-14 rounded-xl bg-light-grey hover:bg-border-grey active:scale-95 text-xl font-semibold text-navy transition-all disabled:opacity-50"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          disabled={disabled}
          className="flex items-center justify-center h-14 rounded-xl bg-light-grey hover:bg-border-grey active:scale-95 text-xl font-semibold text-navy transition-all disabled:opacity-50"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={disabled}
          aria-label="Delete"
          className="flex items-center justify-center h-14 rounded-xl bg-light-grey hover:bg-border-grey active:scale-95 transition-all disabled:opacity-50"
        >
          <Delete className="w-5 h-5 text-charcoal" />
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger text-center">{error}</p>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
