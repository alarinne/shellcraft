/** Mirrors backend `password_policy.py` for client-side registration checks. */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_REQUIREMENTS_TEXT =
  '8–128 characters with uppercase, lowercase, a number, and a symbol.';

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^\w\s]/.test(password)) {
    return 'Password must include at least one symbol.';
  }
  return null;
}

export function validateRegisterForm(
  name: string,
  email: string,
  password: string,
): string | null {
  if (!name.trim()) {
    return 'Enter your name.';
  }
  if (!email.trim()) {
    return 'Enter your email.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  return validatePassword(password);
}

export function validateLoginForm(identifier: string, password: string): string | null {
  if (!identifier.trim()) {
    return 'Enter your name or email.';
  }
  if (!password) {
    return 'Enter your password.';
  }
  return null;
}

/** Mask password length for the auth-page terminal preview. */
export function maskPasswordPreview(password: string): string {
  if (!password) {
    return '(empty)';
  }
  return '*'.repeat(password.length);
}
