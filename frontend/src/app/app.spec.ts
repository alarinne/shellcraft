import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { AUTH_STORAGE, createMemoryAuthStorage } from './core/auth/auth-storage';
import { AuthService } from './core/auth/auth.service';
import { EXECUTION_BACKEND } from './core/execution/execution-backend';
import { SimulatedBackend } from './core/execution/simulated-backend';

describe('App shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
        { provide: EXECUTION_BACKEND, useClass: SimulatedBackend },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the persistent shell brand and navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ShellCraft');
    expect(compiled.textContent).toContain('Explore');
    expect(compiled.textContent).toContain('Labs');
    expect(compiled.textContent).toContain('About');
    expect(compiled.textContent).toContain('Sign up');
    expect(compiled.textContent).toContain('Sign in');
    expect(compiled.textContent).toContain('Contact the team');
    expect(compiled.textContent).toContain('aruzhan.zharkenova.m@gmail.com');
    expect(compiled.textContent).toContain('aspandyar@gmail.com');
  });

  it('should route between landing, path, and lab screens', async () => {
    TestBed.inject(AuthService).register('Ada Lovelace', 'ada@shellcraft.dev', 'secret1');

    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.textContent).toContain('Learn Linux');

    await harness.navigateByUrl('/path');
    expect(harness.routeNativeElement?.textContent).toContain('Pro Developer Track');

    await harness.navigateByUrl('/lab/lab-02');
    expect(harness.routeNativeElement?.textContent).toContain(
      'Inspect the current permissions of deploy.sh',
    );
  });
});
