import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../auth/auth-storage';
import { AuthService } from '../auth/auth.service';
import { installApiMock, settle } from '../testing/api-mock';
import { LAB_01_FILESYSTEM } from '../labs/lab-01-filesystem';
import { LabProgress } from './lab-progress';

const member = {
  id: 'u-ada',
  name: 'Ada Lovelace',
  email: 'ada@shellcraft.dev',
  xp: 0,
  level: 1,
  createdAt: '2026-01-01T00:00:00Z',
};

function configure(): void {
  TestBed.configureTestingModule({
    providers: [{ provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage }],
  });
}

describe('LabProgress', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('tracks guest progress in localStorage', async () => {
    installApiMock({});
    configure();
    const progress = TestBed.inject(LabProgress);

    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(false);
    await progress.complete(LAB_01_FILESYSTEM);
    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(true);

    progress.resetLab(LAB_01_FILESYSTEM.id);
    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(false);
  });

  it('loads and persists progress through the backend for members', async () => {
    const completed = new Set<string>();
    installApiMock({
      'GET /api/auth/me': { status: 200, body: member },
      'GET /api/progress': () => ({
        status: 200,
        body: Array.from(completed).map((labId) => ({ labId, status: 'completed' })),
      }),
      [`POST /api/progress/${LAB_01_FILESYSTEM.id}/complete`]: () => {
        completed.add(LAB_01_FILESYSTEM.id);
        return { status: 200, body: { labProgress: { labId: LAB_01_FILESYSTEM.id }, user: member } };
      },
    });
    configure();
    const auth = TestBed.inject(AuthService);
    const progress = TestBed.inject(LabProgress);

    await auth.restoreSession();
    await settle();
    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(false);

    await progress.complete(LAB_01_FILESYSTEM);
    await settle();
    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(true);
  });
});
