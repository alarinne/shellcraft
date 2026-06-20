import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login.page';
import { AUTH_STORAGE } from '../../core/auth/auth.service';
import { MemoryStore, PROGRESS_STORAGE } from '../../core/progress/progress.service';

describe('LoginPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useValue: new MemoryStore() },
        { provide: PROGRESS_STORAGE, useValue: new MemoryStore() },
      ],
    }).compileComponents();
  });

  it('renders the sign-in form', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Sign in to ShellCraft');
    expect(compiled.querySelectorAll('input').length).toBe(2);
  });

  it('shows an error for invalid credentials', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as {
      email: { set(v: string): void };
      password: { set(v: string): void };
      submit(): void;
    };
    cmp.email.set('nobody@example.com');
    cmp.password.set('wrong');
    cmp.submit();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Invalid email or password');
  });
});
