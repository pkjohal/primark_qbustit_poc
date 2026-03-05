/**
 * QR code data format for the Qbust.it EPOS integration.
 * Format: LIST_EAN1_EAN2_EAN3_...
 * The LIST prefix identifies the payload to the EPOS system.
 */

export const QR_ITEM_LIMIT = 280;
const QR_CHAR_LIMIT = 4296;

export function buildQrString(eans: string[]): string {
  return `LIST_${eans.join('_')}`;
}

export function parseQrString(qr: string): string[] {
  if (!qr.startsWith('LIST_')) throw new Error('Invalid QR format: missing LIST_ prefix');
  return qr.slice(5).split('_');
}

export function exceedsQrLimit(eans: string[]): boolean {
  return buildQrString(eans).length > QR_CHAR_LIMIT;
}
