import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { initAudioContext } from '@/lib/audio';
import type { Store, User } from '@/lib/types';

type Step = 'store' | 'user' | 'pin';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const step: Step = !selectedStore ? 'store' : !selectedUser ? 'user' : 'pin';

  useEffect(() => {
    supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setStores(data as Store[]);
        setLoading(false);
      });
  }, []);

  const handleStoreSelect = async (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;
    setSelectedStore(store);
    setSelectedUser(null);
    setPin('');
    setError('');

    setUsersLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name');
    setUsers((data ?? []) as User[]);
    setUsersLoading(false);
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setSelectedUser(user);
    setPin('');
    setError('');
    initAudioContext(); // unlock audio on first user interaction
  };

  const handlePinDigit = async (digit: string) => {
    if (isLoggingIn || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      setIsLoggingIn(true);
      const success = await login(selectedStore!.id, selectedUser!.id, next);
      setIsLoggingIn(false);

      if (success) {
        navigate('/scan', { replace: true });
      } else {
        setError('Incorrect PIN. Please try again.');
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin('');
        }, 600);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleBack = () => {
    if (selectedUser) {
      setSelectedUser(null);
      setPin('');
      setError('');
    } else if (selectedStore) {
      setSelectedStore(null);
      setUsers([]);
      setError('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy to-primark-blue">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-primark-blue flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <p
            className="text-primark-blue uppercase font-bold"
            style={{ fontSize: '42px', letterSpacing: '0.2em' }}
          >
            PRIMARK
          </p>
          <p className="text-white/70 text-sm mt-1">Qbust.it — Queue Busting</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Step 1: Store */}
          {step === 'store' && (
            <div>
              <h2 className="text-xl font-bold text-navy mb-5 text-center">
                Select Your Store
              </h2>
              <select
                defaultValue=""
                onChange={(e) => e.target.value && handleStoreSelect(e.target.value)}
                className="w-full border-2 border-border-grey rounded-xl px-4 py-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue focus:ring-2 focus:ring-primark-blue/20"
              >
                <option value="" disabled>Select a store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2: User */}
          {step === 'user' && (
            <div>
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-navy">Select Your Name</h2>
                <p className="text-sm text-mid-grey mt-1">{selectedStore!.name}</p>
              </div>
              {usersLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 border-2 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin" />
                </div>
              ) : (
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && handleUserSelect(e.target.value)}
                  className="w-full border-2 border-border-grey rounded-xl px-4 py-3 text-[15px] text-charcoal focus:outline-none focus:border-primark-blue focus:ring-2 focus:ring-primark-blue/20 mb-4"
                >
                  <option value="" disabled>Select your name…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={handleBack}
                className="w-full py-2.5 text-sm text-primark-blue hover:bg-primark-blue-light rounded-lg transition-colors"
              >
                ← Back to Store Selection
              </button>
            </div>
          )}

          {/* Step 3: PIN */}
          {step === 'pin' && (
            <div>
              <div className="text-center mb-5">
                <h2 className="text-xl font-bold text-navy">Enter Your PIN</h2>
                <p className="text-sm text-mid-grey mt-1">{selectedUser!.name}</p>
              </div>

              {/* PIN dot indicators */}
              <div className="flex justify-center mb-6">
                <div
                  className="flex gap-5"
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
                    onClick={() => handlePinDigit(String(n))}
                    disabled={isLoggingIn}
                    className="flex items-center justify-center h-14 rounded-xl bg-light-grey hover:bg-border-grey active:scale-95 text-xl font-semibold text-navy transition-all disabled:opacity-50"
                  >
                    {n}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinDigit('0')}
                  disabled={isLoggingIn}
                  className="flex items-center justify-center h-14 rounded-xl bg-light-grey hover:bg-border-grey active:scale-95 text-xl font-semibold text-navy transition-all disabled:opacity-50"
                >
                  0
                </button>
                <button
                  onClick={handlePinDelete}
                  disabled={isLoggingIn}
                  aria-label="Delete"
                  className="flex items-center justify-center h-14 rounded-xl bg-light-grey hover:bg-border-grey active:scale-95 transition-all disabled:opacity-50"
                >
                  <Delete className="w-5 h-5 text-charcoal" />
                </button>
              </div>

              {error && (
                <p className="mt-4 text-sm text-danger text-center">{error}</p>
              )}

              <button
                onClick={handleBack}
                className="w-full mt-4 py-2.5 text-sm text-primark-blue hover:bg-primark-blue-light rounded-lg transition-colors"
              >
                ← Back to Name Selection
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-6">
          Internal use only • Staff members only
        </p>
      </div>

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
