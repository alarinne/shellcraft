import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'sc-register-page',
  imports: [RouterLink],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly displayName = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal('');

  protected submit(): void {
    const result = this.auth.register(this.email(), this.password(), this.displayName());
    if (!result.ok) {
      this.error.set(result.error ?? 'Registration failed.');
      return;
    }
    void this.router.navigateByUrl('/path');
  }
}
