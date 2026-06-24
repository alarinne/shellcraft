import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { AUTH_STORAGE, createMemoryAuthStorage } from './core/auth/auth-storage';
import { AuthService } from './core/auth/auth.service';
import { EXECUTION_BACKEND } from './core/execution/execution-backend';
import { SimulatedBackend } from './core/execution/simulated-backend';
import { installApiMock } from './core/testing/api-mock';

const member = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@shellcraft.dev',
  xp: 0,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('App shell', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
        { provide: EXECUTION_BACKEND, useClass: SimulatedBackend },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the persistent shell brand and navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ShellCraft');
    expect(compiled.textContent).toContain('Explore');
    expect(compiled.textContent).toContain('Labs');
    expect(compiled.textContent).toContain('About');
    expect(compiled.textContent).toContain('Sign up');
    expect(compiled.textContent).toContain('Sign in');
    expect(compiled.textContent).toContain('Contact the team');
    expect(compiled.textContent).toContain('aruzhan.zharkenova.m@gmail.com');
    expect(compiled.textContent).toContain('aspandyar@gmail.com');
  });

  it('omits Settings from the footer navigation for signed-in members', async () => {
    installApiMock({
      'GET /api/auth/me': { status: 200, body: member },
      'GET /api/progress': { status: 200, body: [] },
      'GET /api/settings': { status: 404, body: { detail: 'no settings' } },
    });
    await TestBed.inject(AuthService).restoreSession();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const footerNav = fixture.nativeElement.querySelector('.sc-footer-nav') as HTMLElement;

    expect(fixture.nativeElement.textContent).toContain('Settings');
    expect(footerNav.textContent).not.toContain('Settings');
  });

  it('should route between landing, path, and lab screens', async () => {
    installApiMock({
      'GET /api/auth/me': { status: 200, body: member },
      'GET /api/progress': { status: 200, body: [] },
      'GET /api/settings': { status: 404, body: { detail: 'no settings' } },
      'GET /api/health': { status: 200, body: { sandbox: { enabled: false } } },
    });
    await TestBed.inject(AuthService).restoreSession();

    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.textContent).toContain('Learn Linux');

    await harness.navigateByUrl('/path');
    expect(harness.routeNativeElement?.textContent).toContain('Pro Developer Track');

    await harness.navigateByUrl('/lab/lab-02');
    expect(harness.routeNativeElement?.textContent).toContain(
      'Inspect the current permissions of deploy.sh',
    );
  });
});
