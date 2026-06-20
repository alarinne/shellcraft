import { TestBed } from '@angular/core/testing';
import { AUTH_STORAGE, AuthService, hashPassword } from './auth.service';
import { MemoryStore, PROGRESS_STORAGE, ProgressService } from '../progress/progress.service';

function configure() {
  TestBed.configureTestingModule({
    providers: [
      AuthService,
      ProgressService,
      { provide: AUTH_STORAGE, useValue: new MemoryStore() },
      { provide: PROGRESS_STORAGE, useValue: new MemoryStore() },
    ],
  });
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  it('registers a user and signs them in', () => {
    const auth = configure();
    const result = auth.register('Ada@Example.com', 'secret', 'Ada');
    expect(result.ok).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentUser()?.email).toBe('ada@example.com');
    expect(auth.currentUser()?.displayName).toBe('Ada');
  });

  it('rejects duplicate registration', () => {
    const auth = configure();
    auth.register('ada@example.com', 'secret');
    const again = auth.register('ada@example.com', 'other');
    expect(again.ok).toBe(false);
    expect(again.error).toContain('already exists');
  });

  it('logs in with correct credentials and rejects wrong ones', () => {
    const auth = configure();
    auth.register('ada@example.com', 'secret');
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);

    expect(auth.login('ada@example.com', 'nope').ok).toBe(false);
    expect(auth.login('ada@example.com', 'secret').ok).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('restores a session in a new instance', () => {
    const auth = configure();
    auth.register('ada@example.com', 'secret');
    const fresh = TestBed.runInInjectionContext(() => new AuthService());
    expect(fresh.isAuthenticated()).toBe(true);
    expect(fresh.currentUser()?.email).toBe('ada@example.com');
  });

  it('does not store the password in plain text', () => {
    expect(hashPassword('secret')).not.toBe('secret');
  });
});
