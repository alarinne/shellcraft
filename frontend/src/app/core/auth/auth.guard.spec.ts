import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AUTH_STORAGE, AuthService } from './auth.service';
import { MemoryStore, PROGRESS_STORAGE } from '../progress/progress.service';

function runGuard() {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/path' } as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => authGuard(route, state));
}

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useValue: new MemoryStore() },
        { provide: PROGRESS_STORAGE, useValue: new MemoryStore() },
      ],
    });
  });

  it('redirects unauthenticated visitors to /login', () => {
    const result = runGuard();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/login');
  });

  it('allows authenticated visitors', () => {
    TestBed.inject(AuthService).register('ada@example.com', 'secret');
    expect(runGuard()).toBe(true);
  });
});
