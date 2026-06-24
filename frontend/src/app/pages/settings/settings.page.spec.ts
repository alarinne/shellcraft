import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installApiMock, settle } from '../../core/testing/api-mock';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    root.removeAttribute('data-reduced-motion');
    root.style.removeProperty('--sc-terminal-font-size');
  });

  it('renders the preference controls', async () => {
    installApiMock({});
    await TestBed.configureTestingModule({ imports: [SettingsPage] }).compileComponents();
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Settings');
    expect(text).toContain('Theme');
    expect(text).toContain('Terminal font size');
    expect(fixture.nativeElement.querySelector('select')).toBeTruthy();
  });

  it('saves preferences through the settings service', async () => {
    const mock = installApiMock({
      'PUT /api/settings': (init) => ({
        status: 200,
        body: {
          theme: 'dark',
          terminalFontSize: 14,
          soundEnabled: true,
          reducedMotion: false,
          extras: {},
          ...JSON.parse((init?.body as string) ?? '{}'),
        },
      }),
    });
    await TestBed.configureTestingModule({ imports: [SettingsPage] }).compileComponents();
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'light';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    await settle();
    fixture.detectChanges();

    const putCall = mock.calls.find((call) => call.method === 'PUT');
    expect(putCall).toBeTruthy();
    expect((putCall?.body as { theme?: string }).theme).toBe('light');
    expect(fixture.nativeElement.textContent).toContain('Settings saved.');
  });
});
