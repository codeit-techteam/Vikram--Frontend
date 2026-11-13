const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const GSTIN_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const VALID_GST_STATE_CODES = new Set([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '26', '27', '28', '29', '30', '31',
  '32', '33', '34', '35', '36', '37', '38',
]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gstinChecksumChar(gstinWithoutCheck: string): string {
  let factor = 1;
  let sum = 0;
  const base = GSTIN_CHARSET.length;
  for (let i = 0; i < gstinWithoutCheck.length; i += 1) {
    const codePoint = GSTIN_CHARSET.indexOf(gstinWithoutCheck[i]!);
    if (codePoint < 0) return '';
    let product = codePoint * factor;
    factor = factor === 1 ? 2 : 1;
    product = Math.floor(product / base) + (product % base);
    sum += product;
  }
  const checkCodePoint = (base - (sum % base)) % base;
  return GSTIN_CHARSET[checkCodePoint] ?? '';
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return null;
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return 'Mobile number is required';
  if (digits.length !== 10) return 'Please enter a valid 10-digit mobile number.';
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export function isValidGstFormat(gst: string): boolean {
  const normalized = gst.trim().toUpperCase();
  if (!GSTIN_REGEX.test(normalized)) return false;
  if (!VALID_GST_STATE_CODES.has(normalized.slice(0, 2))) return false;
  const expected = gstinChecksumChar(normalized.slice(0, 14));
  return Boolean(expected) && normalized[14] === expected;
}

export function validateGst(gst: string): string | null {
  if (!gst.trim()) return 'GST number is required';
  if (!isValidGstFormat(gst)) return 'Invalid GST Number';
  return null;
}
