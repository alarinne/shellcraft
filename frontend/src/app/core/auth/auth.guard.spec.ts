import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';
import { AUTH_STORAGE, createMemoryAuthStorage } from './auth-storage';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
      ],
    });
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

  it('allows authenticated users', () => {
    TestBed.inject(AuthService).register('Grace Hopper', 'grace@shellcraft.dev', 'compiler');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/path' } as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });
});

