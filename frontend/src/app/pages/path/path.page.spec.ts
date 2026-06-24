import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../../core/auth/auth-storage';
import { AuthService } from '../../core/auth/auth.service';
import { LAB_01_FILESYSTEM } from '../../core/labs/lab-01-filesystem';
import { installApiMock, settle } from '../../core/testing/api-mock';
import { PathPage } from './path.page';

const member = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@shellcraft.dev',
  xp: 120,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('PathPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathPage],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
      ],
    }).compileComponents();
  });

  it('renders the guest roadmap overview with lab cards', () => {
    const fixture = TestBed.createComponent(PathPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Master the Linux Path');
    expect(compiled.textContent).toContain('Filesystem Quest');
    expect(compiled.textContent).toContain('Permissions');
    expect(compiled.textContent).toContain('Pipes & Grep');
    expect(compiled.textContent).toContain('Requires Lab 01 progress');
    expect(compiled.textContent).toContain('Terminal Scout - Tier 1');
    expect(compiled.querySelectorAll('.sc-roadmap-card').length).toBe(5);
  });

  it('shows progress-driven lab status for a signed-in member', async () => {
    installApiMock({
      'GET /api/auth/me': { status: 200, body: member },
      'GET /api/progress': {
        status: 200,
        body: [{ labId: LAB_01_FILESYSTEM.id, status: 'completed' }],
      },
      'GET /api/settings': { status: 404, body: { detail: 'none' } },
    });
    await TestBed.inject(AuthService).restoreSession();

    const fixture = TestBed.createComponent(PathPage);
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('1');
    expect(compiled.textContent).toContain('120');
    expect(compiled.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('Review');
    expect(compiled.textContent).toContain('Permissions');
    expect(compiled.textContent).toContain('Current');
    expect(compiled.textContent).toContain('Ada Lovelace');
    expect(compiled.textContent).toContain('lab_01_filesystem');
    expect(compiled.textContent).toContain('lab_04_processes');
    expect(compiled.textContent).toContain('lab_05_signals');
    expect(compiled.querySelector('.sc-path-lab[data-status="done"]')).toBeTruthy();
  });
});
