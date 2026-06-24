import { computed, inject, Injectable, signal } from '@angular/core';
import { AUTH_STORAGE } from './auth-storage';

const USERS_KEY = 'shellcraft.auth.users.v1';
const SESSION_KEY = 'shellcraft.auth.session.v1';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

interface StoredUser extends AuthUser {
  salt: string;
  passwordDigest: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(AUTH_STORAGE);
  private readonly users = signal<readonly StoredUser[]>(readJson<StoredUser[]>(this.storage, USERS_KEY, []));
  private readonly sessionUserId = signal<string | null>(this.storage.getItem(SESSION_KEY));

  readonly currentUser = computed<AuthUser | null>(() => {
    const userId = this.sessionUserId();
    const user = this.users().find((candidate) => candidate.id === userId);
    return user ? publicUser(user) : null;
  });

  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  register(name: string, email: string, password: string): AuthResult {
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    const validationError = validateCredentials(normalizedName, normalizedEmail, password);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    if (this.users().some((user) => user.email === normalizedEmail)) {
      return { ok: false, error: 'This email is already registered.' };
    }

    const salt = createSalt();
    const user: StoredUser = {
      id: createUserId(),
      name: normalizedName,
      email: normalizedEmail,
      salt,
      // Demo-only client digest. Production auth must hash on the backend.
      passwordDigest: digestPassword(password, salt),
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...this.users(), user];
    this.users.set(nextUsers);
    this.persistUsers(nextUsers);
    this.setSession(user.id);
    return { ok: true, user: publicUser(user) };
  }

  login(identifier: string, password: string): AuthResult {
    const normalizedIdentifier = normalizeLoginIdentifier(identifier);
    const user = this.users().find(
      (candidate) =>
        candidate.email === normalizedIdentifier ||
        candidate.name.toLowerCase() === normalizedIdentifier,
    );
    if (!user || user.passwordDigest !== digestPassword(password, user.salt)) {
      return { ok: false, error: 'Name, email, or password is incorrect.' };
    }

    this.setSession(user.id);
    return { ok: true, user: publicUser(user) };
  }

  logout(): void {
    this.sessionUserId.set(null);
    this.storage.removeItem(SESSION_KEY);
  }

  private setSession(userId: string): void {
    this.sessionUserId.set(userId);
    this.storage.setItem(SESSION_KEY, userId);
  }

  private persistUsers(users: readonly StoredUser[]): void {
    this.storage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

function publicUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 48);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeLoginIdentifier(identifier: string): string {
  return identifier.trim().replace(/\s+/g, ' ').toLowerCase();
}

function validateCredentials(name: string, email: string, password: string): string | null {
  if (name.length < 2) {
    return 'Enter your name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

function createUserId(): string {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSalt(): string {
  return Math.random().toString(36).slice(2, 12);
}

function digestPassword(password: string, salt: string): string {
  let hash = 2166136261;
  const input = `${salt}:${password}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function readJson<T>(storage: { getItem(key: string): string | null }, key: string, fallback: T): T {
  const raw = storage.getItem(key);
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
