import { TestBed } from '@angular/core/testing';
import { AUTH_STORAGE, createMemoryAuthStorage } from './auth-storage';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage }],
    });
  });

  it('registers a user and starts a session', () => {
    const auth = TestBed.inject(AuthService);

    const result = auth.register('Ada Lovelace', 'Ada@ShellCraft.dev', 'secret1');

    expect(result.ok).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentUser()?.email).toBe('ada@shellcraft.dev');
    expect(auth.currentUser()?.name).toBe('Ada Lovelace');
  });

  it('rejects duplicate registration and invalid login', () => {
    const auth = TestBed.inject(AuthService);
    auth.register('Ada Lovelace', 'ada@shellcraft.dev', 'secret1');

    expect(auth.register('Ada Again', 'ada@shellcraft.dev', 'secret1').ok).toBe(false);
    auth.logout();
    expect(auth.login('ada@shellcraft.dev', 'wrong-password').ok).toBe(false);
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('logs in by email or name and logs out an existing user', () => {
    const auth = TestBed.inject(AuthService);
    auth.register('Linus Torvalds', 'linus@shellcraft.dev', 'kernel7');
    auth.logout();

    expect(auth.login('linus@shellcraft.dev', 'kernel7').ok).toBe(true);
    expect(auth.currentUser()?.name).toBe('Linus Torvalds');

    auth.logout();
    expect(auth.login('Linus Torvalds', 'kernel7').ok).toBe(true);
    expect(auth.currentUser()?.email).toBe('linus@shellcraft.dev');

    auth.logout();
    expect(auth.currentUser()).toBeNull();
  });
});
