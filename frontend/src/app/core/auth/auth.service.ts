import { computed, Injectable, signal } from '@angular/core';
import { apiFetch } from '../api/http';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
}

export interface AuthResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

/** Backend `UserPublic` payload (camelCase). */
interface UserPayload {
  id: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<AuthUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /**
   * Hydrate the session from the httpOnly cookie on app start. Resolves to the
   * user when a valid session exists, otherwise `null`. Never rejects.
   */
  async restoreSession(): Promise<AuthUser | null> {
    const result = await apiFetch<UserPayload>('/api/auth/me');
    const user = result.ok && result.data ? toAuthUser(result.data) : null;
    this._currentUser.set(user);
    return user;
  }

  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const result = await apiFetch<UserPayload>('/api/auth/register', {
      method: 'POST',
      json: { name: name.trim(), email: email.trim(), password },
    });
    if (!result.ok || !result.data) {
      return { ok: false, error: registerError(result.status, result.error) };
    }
    const user = toAuthUser(result.data);
    this._currentUser.set(user);
    return { ok: true, user };
  }

  async login(identifier: string, password: string): Promise<AuthResult> {
    const result = await apiFetch<UserPayload>('/api/auth/login', {
      method: 'POST',
      json: { identifier: identifier.trim(), password },
    });
    if (!result.ok || !result.data) {
      return { ok: false, error: loginError(result.status, result.error) };
    }
    const user = toAuthUser(result.data);
    this._currentUser.set(user);
    return { ok: true, user };
  }

  async logout(): Promise<void> {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    this._currentUser.set(null);
  }
}

function toAuthUser(payload: UserPayload): AuthUser {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    xp: payload.xp,
    level: payload.level,
  };
}

function registerError(status: number, error?: string): string {
  if (status === 409) {
    return 'This email is already registered.';
  }
  if (status === 422) {
    return error ?? 'Enter a valid name, email, and password that meets the requirements.';
  }
  if (status === 503) {
    return error ?? 'Service temporarily unavailable. Try again in a moment.';
  }
  return error ?? 'Could not create your account.';
}

function loginError(status: number, error?: string): string {
  if (status === 401) {
    return 'Name, email, or password is incorrect.';
  }
  if (status === 503) {
    return error ?? 'Service temporarily unavailable. Try again in a moment.';
  }
  return error ?? 'Could not sign you in.';
}
