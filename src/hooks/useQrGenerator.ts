import { useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { buildQrString, exceedsQrLimit } from '@/lib/qrFormat';
import type { BasketItem } from '@/lib/types';

interface UseQrGeneratorReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  dataUrl: string;
  qrString: string;
  generate: (items: BasketItem[]) => Promise<string>;
  isGenerating: boolean;
}

export function useQrGenerator(): UseQrGeneratorReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [qrString, setQrString] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (items: BasketItem[]): Promise<string> => {
    const eans = items.map((i) => i.ean);

    if (exceedsQrLimit(eans)) {
      throw new Error(
        'Basket too large for a single QR code. Please remove some items or split into two baskets.'
      );
    }

    setIsGenerating(true);
    try {
      const qr = buildQrString(eans);
      setQrString(qr);

      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, qr, {
          width: 280,
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#1A1F36', light: '#ffffff' },
        });
        setDataUrl(canvasRef.current.toDataURL('image/png'));
      }
      return qr;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { canvasRef, dataUrl, qrString, generate, isGenerating };
}
