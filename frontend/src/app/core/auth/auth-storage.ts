import { InjectionToken } from '@angular/core';

export interface AuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryAuthStorage(): AuthStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function browserStorage(): AuthStorage {
  try {
    if (typeof globalThis.localStorage !== 'undefined') {
      return globalThis.localStorage;
    }
  } catch {
    // localStorage can throw in restricted browser contexts.
  }
  return createMemoryAuthStorage();
}

export const AUTH_STORAGE = new InjectionToken<AuthStorage>('AUTH_STORAGE', {
  providedIn: 'root',
  factory: browserStorage,
});

