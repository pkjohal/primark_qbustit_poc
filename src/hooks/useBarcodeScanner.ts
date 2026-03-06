import { useRef, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { validateEan13 } from '@/lib/ean13';
import { playBeep } from '@/lib/audio';

interface UseBarcodeSccannerOptions {
  onScan: (ean: string) => void;
  onError?: (message: string) => void;
}

interface UseBarcodeSccannerReturn {
  startScanner: (elementId: string) => Promise<void>;
  stopScanner: () => Promise<void>;
  isScanning: boolean;
  cameraError: string | null;
  retryCamera: (elementId: string) => Promise<void>;
}

const SCAN_DWELL_MS = 2000;

export function useBarcodeScanner({
  onScan,
  onError,
}: UseBarcodeSccannerOptions): UseBarcodeSccannerReturn {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ ean: string; ts: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, [isScanning]);

  const startScanner = useCallback(async (elementId: string) => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch { /* ignore */ }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.floor(viewfinderWidth * 0.8),
            height: Math.floor(viewfinderHeight * 0.25),
          }),
        },
        (decodedText) => {
          if (!validateEan13(decodedText)) {
            onError?.('Invalid barcode — please try again.');
            return;
          }
          const now = Date.now();
          const last = lastScanRef.current;
          if (last && last.ean === decodedText && now - last.ts < SCAN_DWELL_MS) return;
          lastScanRef.current = { ean: decodedText, ts: now };
          playBeep();
          if (navigator.vibrate) navigator.vibrate(80);
          onScan(decodedText);
        },
        () => {
          // Per-frame scan failure is normal; not an error
        }
      );
      setIsScanning(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('permission') || msg.includes('NotAllowed')) {
        setCameraError('camera_denied');
      } else if (msg.includes('NotFound') || msg.includes('no camera')) {
        setCameraError('no_camera');
      } else {
        setCameraError('unavailable');
      }
      setIsScanning(false);
      console.error('Camera start error:', err);
    }
  }, [onScan, onError]);

  const retryCamera = useCallback(async (elementId: string) => {
    await startScanner(elementId);
  }, [startScanner]);

  return { startScanner, stopScanner, isScanning, cameraError, retryCamera };
}
