import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';

interface ShellNavItem {
  label: string;
  path: string;
  /** Route prefix used to highlight the active link. */
  match: string;
}

/**
 * Application shell: a persistent topbar plus a `<router-outlet>`. Screen
 * content lives in routed standalone page components under `pages/`.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.shellcraft.html',
  styleUrl: './app-shellcraft.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly nav: ShellNavItem[] = [
    { label: 'Landing', path: '/', match: '/' },
    { label: 'Learning Path', path: '/path', match: '/path' },
    { label: 'Lab Screen', path: '/lab/lab-02', match: '/lab' },
    { label: 'Completed', path: '/complete', match: '/complete' },
  ];

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected isActive(item: ShellNavItem): boolean {
    const url = this.currentUrl();
    return item.match === '/' ? url === '/' : url.startsWith(item.match);
  }

  protected go(path: string): void {
    void this.router.navigateByUrl(path);
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
