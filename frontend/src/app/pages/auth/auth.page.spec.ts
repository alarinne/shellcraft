import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installApiMock, settle } from '../../core/testing/api-mock';
import { AuthService } from '../../core/auth/auth.service';
import { AuthPage } from './auth.page';

const ada = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@shellcraft.dev',
  xp: 0,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('AuthPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('registers a learner and navigates to the path', async () => {
    installApiMock({ 'POST /api/auth/register': { status: 201, body: ada } });
    const fixture = TestBed.createComponent(AuthPage);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.sc-auth-switch').click();
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'Ada Lovelace';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'ada@shellcraft.dev';
    inputs[1].dispatchEvent(new Event('input'));
    inputs[2].value = 'Secret12!';
    inputs[2].dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await settle();
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/path');
  });

  it('blocks weak passwords before calling the API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fixture = TestBed.createComponent(AuthPage);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.sc-auth-switch').click();
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'Ada Lovelace';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'ada@shellcraft.dev';
    inputs[1].dispatchEvent(new Event('input'));
    inputs[2].value = 'weakpass';
    inputs[2].dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await settle();
    fixture.detectChanges();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('uppercase');
  });

  it('masks the password in the terminal preview', () => {
    const fixture = TestBed.createComponent(AuthPage);
    fixture.detectChanges();

    const passwordInput = fixture.nativeElement.querySelectorAll('input')[1] as HTMLInputElement;
    passwordInput.value = 'ab';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('**');
    expect(fixture.nativeElement.textContent).not.toContain('Secret12!');
  });

  it('shows the backend message for invalid credentials', async () => {
    installApiMock({
      'POST /api/auth/login': { status: 401, body: { detail: 'Invalid credentials' } },
    });
    const fixture = TestBed.createComponent(AuthPage);
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'ada@shellcraft.dev';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'wrongpass';
    inputs[1].dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await settle();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Name, email, or password is incorrect.');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
  });

  it('keeps the form mode in sync with auth query params', async () => {
    const fixture = TestBed.createComponent(AuthPage);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigate([], { queryParams: { mode: 'register' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Create your ShellCraft profile');

    await router.navigate([], { queryParams: {} });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sign in to ShellCraft');
  });
});
