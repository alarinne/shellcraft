import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { apiFetch } from '../api/http';
import { AUTH_STORAGE } from '../auth/auth-storage';
import { AuthService, AuthUser } from '../auth/auth.service';
import { LABS, LabCard, StatItem } from '../shellcraft-data';
import { Lab } from '../execution/types';

const PROGRESS_KEY = 'shellcraft.progress.by-user.v1';
const GUEST_PROGRESS_KEY = 'guest';

/** Keep in sync with backend `LAB_ORDER` in progress_service.py. */
export const LAB_ORDER: readonly string[] = [
  'lab-01',
  'lab-02',
  'lab-03',
  'lab-04',
  'lab-05',
];

interface ProgressRow {
  labId: string;
  status: string;
}

export interface CertificateData {
  id: string;
  holderName: string;
  issuedAt: string;
  labsCompleted: number;
  signature: string;
  verificationUrl: string;
}

/**
 * Lab progress source of truth:
 * - Authenticated users -> backend (`/api/progress`), persisted in Postgres.
 * - Guests -> `localStorage` (unchanged), so the guest roadmap still works.
 */
@Injectable({ providedIn: 'root' })
export class LabProgress {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(AUTH_STORAGE);

  private readonly guestProgress = signal<Record<string, readonly string[]>>(
    readProgress(this.storage),
  );
  private readonly backendCompleted = signal<ReadonlySet<string>>(new Set());
  private readonly ready = signal(false);
  private inflight: Promise<void> | null = null;

  private readonly completedLabIds = computed<ReadonlySet<string>>(() => {
    if (this.auth.isAuthenticated()) {
      return this.backendCompleted();
    }
    return new Set(this.guestProgress()[GUEST_PROGRESS_KEY] ?? []);
  });

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.ready.set(false);
      this.inflight = null;
      void this.syncFromSource(user).then(() => this.ready.set(true));
    });
  }

  readonly stats = computed<readonly StatItem[]>(() => {
    const completedIds = this.completedLabIds();
    const user = this.auth.currentUser();
    const xp = user ? user.xp : xpFor(completedIds);
    return [
      { label: 'Completed', value: String(completedIds.size) },
      { label: 'XP earned', value: String(xp) },
      { label: 'Streak', value: String(completedIds.size) },
    ];
  });

  readonly labs = computed<readonly LabCard[]>(() => {
    const completedIds = this.completedLabIds();
    const currentIndex = LABS.findIndex((lab) => !completedIds.has(lab.id));

    return LABS.map((lab, index) => {
      if (completedIds.has(lab.id)) {
        return { ...lab, status: 'Completed', locked: false, actionLabel: 'Review' };
      }

      if (index === currentIndex) {
        return { ...lab, status: 'Current', locked: false, actionLabel: 'Start lab' };
      }

      return {
        ...lab,
        status: index === currentIndex + 1 ? 'Next' : 'Locked',
        locked: true,
        actionLabel: 'Locked',
      };
    });
  });

  readonly latestCompletedLab = computed<LabCard | null>(() => {
    const completedIds = this.completedLabIds();
    for (let index = LABS.length - 1; index >= 0; index -= 1) {
      const lab = LABS[index];
      if (completedIds.has(lab.id)) {
        return lab;
      }
    }
    return null;
  });

  readonly nextLab = computed<LabCard | null>(() => {
    const completedIds = this.completedLabIds();
    return LABS.find((lab) => !completedIds.has(lab.id)) ?? null;
  });

  isCompleted(labId: string): boolean {
    return this.completedLabIds().has(labId);
  }

  isLabUnlocked(labId: string): boolean {
    if (!LAB_ORDER.includes(labId)) {
      return false;
    }
    if (labId === LAB_ORDER[0]) {
      return true;
    }
    if (this.isCompleted(labId)) {
      return true;
    }
    const index = LAB_ORDER.indexOf(labId);
    const prior = LAB_ORDER[index - 1];
    return this.isCompleted(prior);
  }

  currentLab(): LabCard | null {
    return this.nextLab();
  }

  allLabsCompleted(): boolean {
    return LAB_ORDER.every((labId) => this.isCompleted(labId));
  }

  async ensureLoaded(): Promise<void> {
    if (this.ready()) {
      return;
    }
    if (!this.inflight) {
      this.inflight = this.syncFromSource(this.auth.currentUser()).finally(() => {
        this.ready.set(true);
        this.inflight = null;
      });
    }
    await this.inflight;
  }

  async complete(lab: Lab | LabCard): Promise<void> {
    if (this.auth.isAuthenticated()) {
      const result = await apiFetch<unknown>(`/api/progress/${lab.id}/complete`, {
        method: 'POST',
        json: {},
      });
      if (result.ok) {
        this.backendCompleted.update((ids) => new Set(ids).add(lab.id));
        await this.auth.restoreSession();
      }
      return;
    }

    this.updateGuestProgress((ids) => ids.add(lab.id));
  }

  async fetchCertificate(): Promise<CertificateData | null> {
    const result = await apiFetch<CertificateData>('/api/certificates/me');
    if (result.ok && result.data) {
      return result.data;
    }
    return null;
  }

  resetLab(labId: string): void {
    if (this.auth.isAuthenticated()) {
      this.backendCompleted.update((ids) => {
        const next = new Set(ids);
        next.delete(labId);
        return next;
      });
      return;
    }

    this.updateGuestProgress((ids) => {
      ids.delete(labId);
      return ids;
    });
  }

  private async syncFromSource(user: AuthUser | null): Promise<void> {
    await Promise.resolve();
    if (!user) {
      this.backendCompleted.set(new Set());
      return;
    }

    const result = await apiFetch<ProgressRow[]>('/api/progress');
    if (result.ok && result.data) {
      const ids = result.data
        .filter((row) => row.status === 'completed')
        .map((row) => row.labId);
      this.backendCompleted.set(new Set(ids));
    }
  }

  private updateGuestProgress(update: (ids: Set<string>) => Set<string>): void {
    const nextIds = Array.from(update(new Set(this.guestProgress()[GUEST_PROGRESS_KEY] ?? [])));
    const nextProgress = {
      ...this.guestProgress(),
      [GUEST_PROGRESS_KEY]: nextIds,
    };
    this.guestProgress.set(nextProgress);
    this.storage.setItem(PROGRESS_KEY, JSON.stringify(nextProgress));
  }
}

function xpFor(completedIds: ReadonlySet<string>): number {
  return LABS.reduce((total, lab) => (completedIds.has(lab.id) ? total + lab.xp : total), 0);
}

function readProgress(storage: { getItem(key: string): string | null }): Record<string, readonly string[]> {
  const raw = storage.getItem(PROGRESS_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, readonly string[]>;
  } catch {
    return {};
  }
}
