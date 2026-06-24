import { computed, inject, Injectable, signal } from '@angular/core';
import { AUTH_STORAGE } from '../auth/auth-storage';
import { AuthService } from '../auth/auth.service';
import { LABS, LabCard, StatItem } from '../shellcraft-data';
import { Lab } from '../execution/types';

const PROGRESS_KEY = 'shellcraft.progress.by-user.v1';
const GUEST_PROGRESS_KEY = 'guest';

@Injectable({ providedIn: 'root' })
export class LabProgress {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(AUTH_STORAGE);
  private readonly completedByUser = signal<Record<string, readonly string[]>>(
    readProgress(this.storage),
  );
  private readonly activeProgressKey = computed(() => this.auth.currentUser()?.id ?? GUEST_PROGRESS_KEY);
  private readonly completedLabIds = computed<ReadonlySet<string>>(
    () => new Set(this.completedByUser()[this.activeProgressKey()] ?? []),
  );

  readonly stats = computed<readonly StatItem[]>(() => {
    const completedIds = this.completedLabIds();
    return [
      { label: 'Completed', value: String(completedIds.size) },
      { label: 'XP earned', value: String(xpFor(completedIds)) },
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

  complete(lab: Lab | LabCard): void {
    this.updateActiveProgress((ids) => ids.add(lab.id));
  }

  resetLab(labId: string): void {
    this.updateActiveProgress((ids) => {
      ids.delete(labId);
      return ids;
    });
  }

  private updateActiveProgress(update: (ids: Set<string>) => Set<string>): void {
    const key = this.activeProgressKey();
    const nextIds = Array.from(update(new Set(this.completedByUser()[key] ?? [])));
    const nextProgress = {
      ...this.completedByUser(),
      [key]: nextIds,
    };
    this.completedByUser.set(nextProgress);
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
