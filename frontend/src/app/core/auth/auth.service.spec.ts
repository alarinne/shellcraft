import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installApiMock } from '../testing/api-mock';
import { AuthService } from './auth.service';

const ada = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@shellcraft.dev',
  xp: 0,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};
const linus = {
  id: 'u-linus',
  name: 'Linus Torvalds',
  email: 'linus@shellcraft.dev',
  xp: 250,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

function service(): AuthService {
  TestBed.configureTestingModule({});
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('registers a user and starts a session', async () => {
    installApiMock({ 'POST /api/auth/register': { status: 201, body: ada } });
    const auth = service();

    const result = await auth.register('Ada Lovelace', 'ada@shellcraft.dev', 'Secret12!');

    expect(result.ok).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentUser()?.email).toBe('ada@shellcraft.dev');
    expect(auth.currentUser()?.level).toBe(1);
  });

  it('maps a duplicate email (409) to a friendly error', async () => {
    installApiMock({
      'POST /api/auth/register': { status: 409, body: { detail: 'Email already registered' } },
    });
    const auth = service();

    const result = await auth.register('Ada', 'ada@shellcraft.dev', 'Secret12!');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('This email is already registered.');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('rejects invalid login (401) and logs in/out by credentials', async () => {
    let loggedIn = false;
    installApiMock({
      'POST /api/auth/login': (init) => {
        const body = JSON.parse((init?.body as string) ?? '{}');
        if (body.password === 'kernel77') {
          loggedIn = true;
          return { status: 200, body: linus };
        }
        return { status: 401, body: { detail: 'Invalid credentials' } };
      },
      'POST /api/auth/logout': { status: 204 },
    });
    const auth = service();

    const bad = await auth.login('linus@shellcraft.dev', 'wrong');
    expect(bad.ok).toBe(false);
    expect(bad.error).toBe('Name, email, or password is incorrect.');
    expect(auth.isAuthenticated()).toBe(false);

    const good = await auth.login('linus@shellcraft.dev', 'kernel77');
    expect(good.ok).toBe(true);
    expect(auth.currentUser()?.name).toBe('Linus Torvalds');
    expect(loggedIn).toBe(true);

    await auth.logout();
    expect(auth.currentUser()).toBeNull();
  });

  it('restores a session from the cookie', async () => {
    installApiMock({ 'GET /api/auth/me': { status: 200, body: ada } });
    const auth = service();

    const user = await auth.restoreSession();

    expect(user?.email).toBe('ada@shellcraft.dev');
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('treats a 401 from /me as a guest', async () => {
    installApiMock({ 'GET /api/auth/me': { status: 401, body: { detail: 'No session' } } });
    const auth = service();

    const user = await auth.restoreSession();

    expect(user).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });
});
