import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ViewportScroller } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from './core/auth/auth.service';
import { DEFAULT_LAB_ID } from './core/shellcraft-data';

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
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly auth = inject(AuthService);

  private readonly guestNav: ShellNavItem[] = [
    { label: 'Explore', path: '/', match: '/' },
    { label: 'Labs', path: '/path', match: '/path' },
    { label: 'About', path: '/#about', match: '/#about' },
  ];
  private readonly memberNav: ShellNavItem[] = [
    { label: 'Explore', path: '/', match: '/' },
    { label: 'Labs', path: '/path', match: '/path' },
    { label: 'Lab Screen', path: `/lab/${DEFAULT_LAB_ID}`, match: '/lab' },
    { label: 'Completed', path: '/complete', match: '/complete' },
    { label: 'Settings', path: '/settings', match: '/settings' },
    { label: 'About', path: '/#about', match: '/#about' },
  ];

  protected readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly currentUser = this.auth.currentUser;
  protected readonly nav = computed(() => (this.currentUser() ? this.memberNav : this.guestNav));
  protected readonly sessionTitle = computed(() => this.currentUser()?.name ?? 'Guest');
  protected readonly sessionMeta = computed(() => this.currentUser()?.email ?? 'Not signed in');

  protected isActive(item: ShellNavItem): boolean {
    const url = this.currentUrl();
    return item.match === '/' ? url === '/' : url.startsWith(item.match);
  }

  protected go(path: string): void {
    const [route, fragment] = path.split('#');
    void this.router.navigateByUrl(path).then(() => {
      if (fragment) {
        this.viewportScroller.scrollToAnchor(fragment);
      } else if (route === '/') {
        this.viewportScroller.scrollToPosition([0, 0]);
      }
    });
  }

  protected signIn(): void {
    void this.router.navigate(['/auth']);
  }

  protected signUp(): void {
    void this.router.navigate(['/auth'], { queryParams: { mode: 'register' } });
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    void this.router.navigate(['/auth']);
  }
}
