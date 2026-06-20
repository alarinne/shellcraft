import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'sc-login-page',
  imports: [RouterLink],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');

  protected submit(): void {
    const result = this.auth.login(this.email(), this.password());
    if (!result.ok) {
      this.error.set(result.error ?? 'Sign in failed.');
      return;
    }
    const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/path';
    void this.router.navigateByUrl(redirect);
  }
}
