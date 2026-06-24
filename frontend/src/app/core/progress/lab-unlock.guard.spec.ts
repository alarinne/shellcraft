import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../auth/auth-storage';
import { installApiMock, settle } from '../testing/api-mock';
import { labUnlockGuard } from './lab-unlock.guard';
import { LabProgress } from './lab-progress';

const member = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@shellcraft.dev',
  xp: 0,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

function routeWithLab(id: string): ActivatedRouteSnapshot {
  return {
    paramMap: {
      get: (key: string) => (key === 'id' ? id : null),
    },
  } as ActivatedRouteSnapshot;
}

describe('labUnlockGuard', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
      ],
    });
  });

  it('allows lab-01 for a new member', async () => {
    installApiMock({
      'GET /api/auth/me': { status: 200, body: member },
      'GET /api/progress': { status: 200, body: [] },
    });

    const progress = TestBed.inject(LabProgress);
    await progress.ensureLoaded();
    await settle();

    const result = await TestBed.runInInjectionContext(() =>
      labUnlockGuard(routeWithLab('lab-01'), {} as never),
    );

    expect(result).toBe(true);
  });

  it('redirects to path when a later lab is locked', async () => {
    installApiMock({
      'GET /api/auth/me': { status: 200, body: member },
      'GET /api/progress': { status: 200, body: [] },
    });

    const progress = TestBed.inject(LabProgress);
    await progress.ensureLoaded();
    await settle();

    const result = await TestBed.runInInjectionContext(() =>
      labUnlockGuard(routeWithLab('lab-03'), {} as never),
    );

    expect(result.toString()).toBe(
      TestBed.inject(Router).createUrlTree(['/path'], {
        queryParams: { locked: 'lab-03' },
      }).toString(),
    );
  });
});
