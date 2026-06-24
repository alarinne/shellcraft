import { describe, expect, it } from 'vitest';
import {
  maskPasswordPreview,
  validateLoginForm,
  validatePassword,
  validateRegisterForm,
} from './password-policy';

describe('password-policy', () => {
  it('accepts a strong password', () => {
    expect(validatePassword('Secret12!')).toBeNull();
  });

  it('rejects passwords missing complexity rules', () => {
    expect(validatePassword('secret12!')).toContain('uppercase');
    expect(validatePassword('Secret12')).toContain('symbol');
  });

  it('validates register form fields', () => {
    expect(validateRegisterForm('', 'ada@example.com', 'Secret12!')).toContain('name');
    expect(validateRegisterForm('Ada', 'bad-email', 'Secret12!')).toContain('valid email');
    expect(validateRegisterForm('Ada', 'ada@example.com', 'weak')).not.toBeNull();
    expect(validateRegisterForm('Ada', 'ada@example.com', 'Secret12!')).toBeNull();
  });

  it('validates login form fields', () => {
    expect(validateLoginForm('', 'Secret12!')).toContain('name or email');
    expect(validateLoginForm('ada@example.com', '')).toContain('password');
    expect(validateLoginForm('ada@example.com', 'Secret12!')).toBeNull();
  });

  it('masks password preview for the auth terminal', () => {
    expect(maskPasswordPreview('')).toBe('(empty)');
    expect(maskPasswordPreview('ab')).toBe('**');
    expect(maskPasswordPreview('Secret12!')).toBe('*********');
  });
});
