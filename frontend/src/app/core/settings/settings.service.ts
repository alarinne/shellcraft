import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { apiFetch } from '../api/http';
import { AuthService, AuthUser } from '../auth/auth.service';

export interface UserSettings {
  theme: string;
  terminalFontSize: number;
  soundEnabled: boolean;
  reducedMotion: boolean;
  extras: Record<string, unknown>;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  terminalFontSize: 14,
  soundEnabled: true,
  reducedMotion: false,
  extras: {},
};

/**
 * User preferences backed by `/api/settings` for signed-in users. Preferences
 * are applied to the document root so the whole app reacts (theme, terminal
 * font size, reduced motion). Guests just see the defaults.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);

  private readonly _settings = signal<UserSettings>({ ...DEFAULT_SETTINGS });
  private readonly _loaded = signal(false);

  readonly settings = this._settings.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  constructor() {
    // Load settings when the signed-in user changes.
    effect(() => {
      const user = this.auth.currentUser();
      void this.onUserChange(user);
    });
    // Reflect preferences onto the document root.
    effect(() => this.applyPreferences(this._settings()));
  }

  async load(): Promise<void> {
    const result = await apiFetch<UserSettings>('/api/settings');
    if (result.ok && result.data) {
      this._settings.set({ ...DEFAULT_SETTINGS, ...result.data });
    }
    this._loaded.set(true);
  }

  async update(patch: Partial<UserSettings>): Promise<boolean> {
    const result = await apiFetch<UserSettings>('/api/settings', {
      method: 'PUT',
      json: patch,
    });
    if (result.ok && result.data) {
      this._settings.set({ ...DEFAULT_SETTINGS, ...result.data });
      return true;
    }
    return false;
  }

  private async onUserChange(user: AuthUser | null): Promise<void> {
    await Promise.resolve();
    if (!user) {
      this._settings.set({ ...DEFAULT_SETTINGS });
      this._loaded.set(false);
      return;
    }
    await this.load();
  }

  private applyPreferences(settings: UserSettings): void {
    const root = this.document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.style.setProperty('--sc-terminal-font-size', `${settings.terminalFontSize}px`);
    root.setAttribute('data-reduced-motion', String(settings.reducedMotion));
  }
}
