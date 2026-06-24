import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { installApiMock, settle } from '../testing/api-mock';
import { SettingsService } from './settings.service';

const member = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@shellcraft.dev',
  xp: 0,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};
const serverSettings = {
  theme: 'light',
  terminalFontSize: 18,
  soundEnabled: false,
  reducedMotion: true,
  extras: {},
};

describe('SettingsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    root.removeAttribute('data-reduced-motion');
    root.style.removeProperty('--sc-terminal-font-size');
  });

  it('persists updates via PUT and reflects the server response', async () => {
    const mock = installApiMock({
      'PUT /api/settings': (init) => ({
        status: 200,
        body: { ...serverSettings, ...JSON.parse((init?.body as string) ?? '{}') },
      }),
    });
    TestBed.configureTestingModule({});
    const settings = TestBed.inject(SettingsService);

    const ok = await settings.update({ theme: 'dark', terminalFontSize: 12 });

    expect(ok).toBe(true);
    expect(settings.settings().theme).toBe('dark');
    expect(settings.settings().terminalFontSize).toBe(12);
    expect(mock.calls.some((call) => call.method === 'PUT')).toBe(true);
  });

  it('loads settings on sign-in and applies them to the document root', async () => {
    installApiMock({
      'GET /api/auth/me': { status: 200, body: member },
      'GET /api/settings': { status: 200, body: serverSettings },
    });
    TestBed.configureTestingModule({});
    const auth = TestBed.inject(AuthService);
    const settings = TestBed.inject(SettingsService);

    await auth.restoreSession();
    await settle();

    expect(settings.loaded()).toBe(true);
    expect(settings.settings().theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--sc-terminal-font-size')).toBe('18px');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
  });
});
