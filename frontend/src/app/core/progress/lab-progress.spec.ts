import { TestBed } from '@angular/core/testing';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../auth/auth-storage';
import { AuthService } from '../auth/auth.service';
import { LAB_01_FILESYSTEM } from '../labs/lab-01-filesystem';
import { LabProgress } from './lab-progress';

describe('LabProgress', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage }],
    });
  });

  it('keeps completed labs separate per authenticated user', () => {
    const auth = TestBed.inject(AuthService);
    const progress = TestBed.inject(LabProgress);

    auth.register('Ada Lovelace', 'ada@shellcraft.dev', 'secret1');
    progress.complete(LAB_01_FILESYSTEM);
    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(true);

    auth.logout();
    auth.register('Grace Hopper', 'grace@shellcraft.dev', 'compiler');
    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(false);

    auth.logout();
    auth.login('ada@shellcraft.dev', 'secret1');
    expect(progress.isCompleted(LAB_01_FILESYSTEM.id)).toBe(true);
  });
});

