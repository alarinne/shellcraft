import { computed, Injectable, signal } from '@angular/core';
import { LABS, LabCard, StatItem } from '../shellcraft-data';
import { Lab } from '../execution/types';

@Injectable({ providedIn: 'root' })
export class LabProgress {
  private readonly completedLabIds = signal<ReadonlySet<string>>(new Set());

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

  isCompleted(labId: string): boolean {
    return this.completedLabIds().has(labId);
  }

  complete(lab: Lab | LabCard): void {
    this.completedLabIds.update((ids) => new Set(ids).add(lab.id));
  }

  resetLab(labId: string): void {
    this.completedLabIds.update((ids) => {
      const nextIds = new Set(ids);
      nextIds.delete(labId);
      return nextIds;
    });
  }
}

function xpFor(completedIds: ReadonlySet<string>): number {
  return LABS.reduce((total, lab) => (completedIds.has(lab.id) ? total + lab.xp : total), 0);
}
