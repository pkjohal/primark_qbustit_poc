import { useEffect, useRef, useId } from 'react';
import { Flashlight, FlashlightOff, ZoomIn, Camera } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useCamera } from '@/hooks/useCamera';
import ZoomSlider from '@/components/ui/ZoomSlider';
import ItemCountBadge from './ItemCountBadge';

interface BarcodeScannerProps {
  onScan: (ean: string) => void;
  onError: (message: string) => void;
  itemCount: number;
}

export default function BarcodeScanner({ onScan, onError, itemCount }: BarcodeScannerProps) {
  const uid = useId().replace(/:/g, '');
  const scannerId = `qr-reader-${uid}`;
  const startedRef = useRef(false);

  const { startScanner, stopScanner, isScanning, cameraError, retryCamera } =
    useBarcodeScanner({ onScan, onError });

  const {
    zoomSupported,
    zoomRange,
    currentZoom,
    torchEnabled,
    initFromScannerId,
    setZoom,
    toggleTorch,
  } = useCamera();

  // Start scanner on mount; init zoom after scanner starts
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    startScanner(scannerId).then(() => {
      initFromScannerId(scannerId);
    });

    // Re-init camera on visibility change (app resume)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        retryCamera(scannerId).then(() => initFromScannerId(scannerId));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera error states
  if (cameraError === 'camera_denied') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-navy text-white p-8 text-center">
        <Camera size={48} className="mb-4 text-primark-blue" />
        <h2 className="text-lg font-bold mb-2">Camera Access Required</h2>
        <p className="text-white/70 text-sm">
          Please allow camera access in your browser or device settings, then reload the page.
        </p>
        <p className="text-white/50 text-xs mt-4">
          iOS: Settings → Safari → Camera → Allow
          <br />
          Android: Settings → Apps → Browser → Permissions → Camera
        </p>
      </div>
    );
  }

  if (cameraError === 'no_camera') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-navy text-white p-8 text-center">
        <Camera size={48} className="mb-4 text-mid-grey" />
        <h2 className="text-lg font-bold mb-2">No Camera Detected</h2>
        <p className="text-white/70 text-sm">
          This app requires a device with a rear camera.
        </p>
      </div>
    );
  }

  if (cameraError === 'unavailable') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 bg-navy text-white p-8 text-center">
        <Camera size={48} className="mb-4 text-warning" />
        <h2 className="text-lg font-bold mb-2">Camera Unavailable</h2>
        <p className="text-white/70 text-sm mb-4">
          Another app may be using the camera.
        </p>
        <button
          onClick={() => retryCamera(scannerId).then(() => initFromScannerId(scannerId))}
          className="px-6 py-3 bg-primark-blue text-white rounded-xl font-semibold"
        >
          Tap to Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 bg-black overflow-hidden">
      {/* html5-qrcode target element — fills container */}
      <div
        id={scannerId}
        className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:hidden"
      />

      {/* Targeting overlay — horizontal scan line */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="border-2 border-white/80 rounded-lg"
          style={{ width: '80%', height: '80px' }}
        >
          <div className="w-full h-0.5 bg-primark-blue/80 animate-pulse mt-9" />
        </div>
      </div>

      {/* Top-left: torch toggle */}
      <button
        onClick={toggleTorch}
        className="absolute top-3 left-3 p-2.5 bg-black/50 rounded-xl text-white backdrop-blur-sm"
        aria-label={torchEnabled ? 'Turn off torch' : 'Turn on torch'}
      >
        {torchEnabled ? <Flashlight size={20} className="text-warning" /> : <FlashlightOff size={20} />}
      </button>

      {/* Top-right: item count badge */}
      <div className="absolute top-3 right-3">
        <ItemCountBadge count={itemCount} />
      </div>

      {/* Bottom: zoom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-2 pt-1">
        {zoomSupported ? (
          <ZoomSlider
            min={zoomRange.min}
            max={zoomRange.max}
            step={zoomRange.step ?? 0.1}
            value={currentZoom}
            onChange={setZoom}
          />
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <ZoomIn size={14} className="text-white/50" />
            <p className="text-white/50 text-xs">
              Zoom not supported on this device — move closer to scan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
