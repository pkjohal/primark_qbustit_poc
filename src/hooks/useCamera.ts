import { useState, useCallback } from 'react';

interface ZoomRange {
  min: number;
  max: number;
  step: number;
}

interface UseCameraReturn {
  zoomSupported: boolean;
  zoomRange: ZoomRange;
  currentZoom: number;
  torchEnabled: boolean;
  initFromScannerId: (scannerId: string) => Promise<void>;
  setZoom: (zoom: number) => Promise<void>;
  toggleTorch: () => Promise<void>;
}

function getVideoTrack(scannerId: string): MediaStreamTrack | null {
  const video = document.querySelector(`#${scannerId} video`) as HTMLVideoElement | null;
  if (!video?.srcObject) return null;
  const stream = video.srcObject as MediaStream;
  return stream.getVideoTracks()[0] ?? null;
}

export function useCamera(): UseCameraReturn {
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState<ZoomRange>({ min: 1, max: 5, step: 0.1 });
  const [currentZoom, setCurrentZoom] = useState(1);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannerId, setScannerId] = useState('');

  const initFromScannerId = useCallback(async (id: string) => {
    setScannerId(id);
    // Small delay to ensure video element is ready
    await new Promise((r) => setTimeout(r, 500));
    const track = getVideoTrack(id);
    if (!track) return;

    const caps = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number; step: number };
    };

    if (caps.zoom) {
      setZoomSupported(true);
      setZoomRange(caps.zoom);
      // Apply default 2x zoom
      const defaultZoom = Math.min(2.0, caps.zoom.max);
      try {
        await track.applyConstraints({ advanced: [{ zoom: defaultZoom } as MediaTrackConstraintSet] });
        setCurrentZoom(defaultZoom);
      } catch {
        // Zoom constraint failed — not critical
      }
    }
  }, []);

  const setZoom = useCallback(async (zoom: number) => {
    const track = getVideoTrack(scannerId);
    if (!track || !zoomSupported) return;
    try {
      await track.applyConstraints({ advanced: [{ zoom } as MediaTrackConstraintSet] });
      setCurrentZoom(zoom);
    } catch (err) {
      console.error('Zoom error:', err);
    }
  }, [scannerId, zoomSupported]);

  const toggleTorch = useCallback(async () => {
    const track = getVideoTrack(scannerId);
    if (!track) return;
    const newState = !torchEnabled;
    try {
      await track.applyConstraints({ advanced: [{ torch: newState } as MediaTrackConstraintSet] });
      setTorchEnabled(newState);
    } catch (err) {
      console.error('Torch error:', err);
    }
  }, [scannerId, torchEnabled]);

  return { zoomSupported, zoomRange, currentZoom, torchEnabled, initFromScannerId, setZoom, toggleTorch };
}
