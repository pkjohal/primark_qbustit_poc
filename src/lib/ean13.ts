/**
 * Validates an EAN-13 barcode.
 * Algorithm:
 *  1. Must be exactly 13 digits.
 *  2. Sum odd-position digits (1,3,5,...) × 1 and even-position digits (2,4,6,...) × 3.
 *  3. Check digit = (10 - (sum % 10)) % 10
 *  4. The 13th digit must equal the calculated check digit.
 */
export function validateEan13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const sum = digits.slice(0, 12).reduce(
    (acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3),
    0
  );
  const check = (10 - (sum % 10)) % 10;
  return check === digits[12];
}
