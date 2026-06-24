import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'sc-auth-page',
  templateUrl: './auth.page.html',
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly mode = signal<AuthMode>(
    this.route.snapshot.queryParamMap.get('mode') === 'register' ? 'register' : 'login',
  );
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal<string | null>(null);

  protected readonly isRegister = computed(() => this.mode() === 'register');
  protected readonly title = computed(() =>
    this.isRegister() ? 'Create your ShellCraft profile' : 'Sign in to ShellCraft',
  );
  protected readonly submitLabel = computed(() =>
    this.isRegister() ? 'Create account' : 'Sign in',
  );
  protected readonly switchLabel = computed(() =>
    this.isRegister() ? 'I already have an account' : 'Create an account',
  );
  protected readonly returnTarget = computed(() => targetLabel(this.returnUrl()));
  protected readonly returnNotice = computed(() => {
    const label = this.returnTarget();
    return label ? `Sign in to open ${label}.` : 'Sign in to keep your XP and lab progress.';
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.mode.set(params.get('mode') === 'register' ? 'register' : 'login');
      this.error.set(null);
    });
  }

  protected setName(value: string): void {
    this.name.set(value);
  }

  protected setEmail(value: string): void {
    this.email.set(value);
  }

  protected setPassword(value: string): void {
    this.password.set(value);
  }

  protected toggleMode(): void {
    const nextMode = this.mode() === 'login' ? 'register' : 'login';
    this.mode.set(nextMode);
    this.error.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: nextMode === 'register' ? 'register' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected submit(event: SubmitEvent): void {
    event.preventDefault();

    const result = this.isRegister()
      ? this.auth.register(this.name(), this.email(), this.password())
      : this.auth.login(this.email(), this.password());

    if (!result.ok) {
      this.error.set(result.error ?? 'Authentication failed.');
      return;
    }

    this.error.set(null);
    void this.router.navigateByUrl(this.returnUrl());
  }

  private returnUrl(): string {
    const value = this.queryParamMap().get('returnUrl') ?? '/path';
    return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/auth')
      ? value
      : '/path';
  }
}

function targetLabel(returnUrl: string): string {
  if (returnUrl.startsWith('/lab')) {
    return 'Lab Screen';
  }
  if (returnUrl.startsWith('/complete')) {
    return 'Completed';
  }
  if (returnUrl.startsWith('/path')) {
    return 'Learning Path';
  }
  return '';
}
