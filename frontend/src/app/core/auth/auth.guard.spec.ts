import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installApiMock } from '../testing/api-mock';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

const member = {
  id: 'u-grace',
  name: 'Grace Hopper',
  email: 'grace@shellcraft.dev',
  xp: 0,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('authGuard', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('redirects guests to auth with returnUrl', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/lab/lab-01' } as RouterStateSnapshot),
    );

    expect(result.toString()).toBe(
      TestBed.inject(Router).createUrlTree(['/auth'], {
        queryParams: { returnUrl: '/lab/lab-01' },
      }).toString(),
    );
  });

  it('allows authenticated users', async () => {
    installApiMock({ 'GET /api/auth/me': { status: 200, body: member } });
    await TestBed.inject(AuthService).restoreSession();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/path' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });
});

