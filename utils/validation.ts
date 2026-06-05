const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return null;
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return 'Mobile number is required';
  if (digits.length < 10) return 'Enter a valid 10-digit mobile number';
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export function validateGst(gst: string): string | null {
  if (!gst.trim()) return 'GST number is required';
  if (!GSTIN_REGEX.test(gst.trim().toUpperCase())) return 'Enter a valid 15-character GSTIN';
  return null;
}
