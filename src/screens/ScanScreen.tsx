import { useState, useRef } from 'react';
import { CheckCircle, Printer, ShoppingBag } from 'lucide-react';
import BarcodeScanner from '@/components/scanning/BarcodeScanner';
import BasketList from '@/components/scanning/BasketList';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useBasket } from '@/context/BasketContext';
import { useAuth } from '@/context/AuthContext';
import { useScanSession } from '@/hooks/useScanSession';
import { useQrGenerator } from '@/hooks/useQrGenerator';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/utils';
import { exceedsQrLimit } from '@/lib/qrFormat';
import type { ScanSession } from '@/lib/types';

export default function ScanScreen() {
  const { items, addItem, removeItem, clearBasket } = useBasket();
  const { user, store } = useAuth();
  const { saveSession, isSaving } = useScanSession();
  const { canvasRef, generate, isGenerating } = useQrGenerator();
  const { showToast } = useToast();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [savedSession, setSavedSession] = useState<ScanSession | null>(null);
  const [qrString, setQrString] = useState('');

  const sessionStartRef = useRef(new Date());

  const handleScan = (ean: string) => {
    const added = addItem(ean);
    if (!added) return; // debounced
  };

  const handleError = (message: string) => {
    showToast(message, 'error');
  };

  const handleGenerate = async () => {
    if (items.length === 0) return;

    const eans = items.map((i) => i.ean);
    if (exceedsQrLimit(eans)) {
      showToast(
        'Basket too large for a single QR code. Please remove some items or split into two baskets.',
        'error'
      );
      return;
    }

    try {
      const qr = await generate(items);
      setQrString(qr);

      // Save to Supabase
      const session = await saveSession(
        items,
        user!.id,
        store!.id,
        qr,
        sessionStartRef.current
      );
      setSavedSession(session);
      setShowQrModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate QR code';
      showToast(msg, 'error');
    }
  };

  const handleNewBasket = () => {
    clearBasket();
    setShowQrModal(false);
    setSavedSession(null);
    setQrString('');
    sessionStartRef.current = new Date();
  };

  const handleClearConfirm = () => {
    clearBasket();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-black">
      {/* Camera viewfinder — 60% */}
      <div className="flex flex-col min-h-0 overflow-hidden" style={{ flex: '6' }}>
        <BarcodeScanner
          onScan={handleScan}
          onError={handleError}
          itemCount={items.length}
        />
      </div>

      {/* Basket panel — 40% */}
      <div className="flex flex-col min-h-0" style={{ flex: '4' }}>
        <BasketList
          items={items}
          onRemove={removeItem}
          onClear={() => setShowClearConfirm(true)}
          onGenerate={handleGenerate}
        />
      </div>

      {/* Clear confirm dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Basket?"
        message={`This will remove all ${items.length} scanned ${items.length === 1 ? 'item' : 'items'}.`}
        confirmLabel="Discard"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* QR Code Modal — full-screen overlay */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto">
          <div className="flex flex-col items-center px-6 py-8 flex-1">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-4">
              <CheckCircle size={36} className="text-success" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-1">QR Code Ready</h2>
            <p className="text-mid-grey text-sm mb-6">
              Show this to the checkout colleague
            </p>

            {/* QR canvas */}
            <div className="p-4 border-2 border-border-grey rounded-2xl mb-6">
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                className="rounded-lg"
              />
            </div>

            {/* Session summary */}
            {savedSession && (
              <div className="w-full bg-light-grey rounded-xl p-4 mb-6 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-mid-grey">Session</span>
                  <span className="font-mono font-medium text-navy">
                    {savedSession.session_number}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-mid-grey">Items</span>
                  <span className="font-medium text-navy">{savedSession.item_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mid-grey">Time</span>
                  <span className="font-medium text-navy">
                    {formatDateTime(savedSession.completed_at ?? savedSession.started_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() =>
                  showToast('Printing is not available in this version.', 'info')
                }
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primark-blue text-white font-semibold"
                style={{ minHeight: '48px' }}
              >
                <Printer size={18} />
                Print
              </button>
              <button
                onClick={handleNewBasket}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-border-grey text-charcoal font-medium"
                style={{ minHeight: '48px' }}
              >
                <ShoppingBag size={18} />
                New Basket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay during save/generation */}
      {(isSaving || isGenerating) && !showQrModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primark-blue/30 border-t-primark-blue rounded-full animate-spin" />
            <p className="text-sm text-charcoal font-medium">Generating QR code…</p>
          </div>
        </div>
      )}
    </div>
  );
}
