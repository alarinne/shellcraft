import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { KeyValueStore, ProgressService, resolveStore } from '../progress/progress.service';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

const USERS_KEY = 'shellcraft.users';
const SESSION_KEY = 'shellcraft.session';

/** DI token for the auth persistence store (swappable in tests). */
export const AUTH_STORAGE = new InjectionToken<KeyValueStore>('AUTH_STORAGE', {
  providedIn: 'root',
  factory: resolveStore,
});

/** Lightweight, non-cryptographic hash — this is a front-end mock, not real auth. */
export function hashPassword(password: string): string {
  let hash = 5381;
  for (const char of password) {
    hash = (hash * 33) ^ char.charCodeAt(0);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Front-end auth backed by a key/value store. Designed to be swapped for a real
 * API later: pages depend only on `currentUser`/`isAuthenticated` and the
 * `register`/`login`/`logout` methods. On sign-in it namespaces
 * {@link ProgressService} so progress is per-user.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(AUTH_STORAGE);
  private readonly progress = inject(ProgressService);

  private readonly _user = signal<User | null>(this.loadSession());
  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    const user = this._user();
    if (user) {
      this.progress.useNamespace(user.id);
    }
  }

  register(email: string, password: string, displayName?: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return { ok: false, error: 'Email and password are required.' };
    }
    const users = this.loadUsers();
    if (users.some((u) => u.email === normalizedEmail)) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    const user: StoredUser = {
      id: cryptoId(),
      email: normalizedEmail,
      displayName: displayName?.trim() || normalizedEmail.split('@')[0],
      passwordHash: hashPassword(password),
    };
    this.saveUsers([...users, user]);
    this.startSession(user);
    return { ok: true };
  }

  login(email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.loadUsers().find((u) => u.email === normalizedEmail);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { ok: false, error: 'Invalid email or password.' };
    }
    this.startSession(user);
    return { ok: true };
  }

  logout(): void {
    this.store.removeItem(SESSION_KEY);
    this._user.set(null);
    this.progress.useNamespace('');
  }

  private startSession(user: StoredUser): void {
    const publicUser: User = { id: user.id, email: user.email, displayName: user.displayName };
    this.store.setItem(SESSION_KEY, JSON.stringify(publicUser));
    this._user.set(publicUser);
    this.progress.useNamespace(user.id);
  }

  private loadSession(): User | null {
    try {
      const raw = this.store.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private loadUsers(): StoredUser[] {
    try {
      const raw = this.store.getItem(USERS_KEY);
      return raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]): void {
    this.store.setItem(USERS_KEY, JSON.stringify(users));
  }
}

function cryptoId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  return c?.randomUUID ? c.randomUUID() : 'u_' + Math.random().toString(36).slice(2, 10);
}
