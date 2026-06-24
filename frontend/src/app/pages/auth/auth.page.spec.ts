import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../../core/auth/auth-storage';
import { AuthService } from '../../core/auth/auth.service';
import { AuthPage } from './auth.page';

describe('AuthPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthPage],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
      ],
    }).compileComponents();
  });

  it('registers a learner and navigates to the path', () => {
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
    inputs[2].value = 'secret1';
    inputs[2].dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/path');
  });

  it('shows a validation message for invalid credentials', () => {
    const fixture = TestBed.createComponent(AuthPage);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Name, email, or password is incorrect.');
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
