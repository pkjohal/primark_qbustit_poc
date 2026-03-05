import { useEffect } from 'react';
import { useQrGenerator } from '@/hooks/useQrGenerator';
import type { BasketItem } from '@/lib/types';

interface QrCodeDisplayProps {
  items: BasketItem[];
  size?: number;
  onGenerated?: (qrString: string, dataUrl: string) => void;
}

export default function QrCodeDisplay({ items, size = 280, onGenerated }: QrCodeDisplayProps) {
  const { generate, dataUrl, qrString } = useQrGenerator();

  useEffect(() => {
    generate(items).then((qr) => {
      onGenerated?.(qr, dataUrl);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <img
      src={dataUrl}
      alt="QR code for basket"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
