import { useEffect } from 'react';
import { useQrGenerator } from '@/hooks/useQrGenerator';
import type { BasketItem } from '@/lib/types';

interface QrCodeDisplayProps {
  items: BasketItem[];
  size?: number;
  onGenerated?: (qrString: string, dataUrl: string) => void;
}

export default function QrCodeDisplay({ items, size = 280, onGenerated }: QrCodeDisplayProps) {
  const { canvasRef, generate, dataUrl, qrString } = useQrGenerator();

  useEffect(() => {
    generate(items).then((qr) => {
      onGenerated?.(qr, canvasRef.current?.toDataURL() ?? '');
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg"
      aria-label="QR code for basket"
    />
  );
}
