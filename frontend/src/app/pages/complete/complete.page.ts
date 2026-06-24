import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_LAB_ID, LabCard } from '../../core/shellcraft-data';
import { LabProgress } from '../../core/progress/lab-progress';

interface CompletionReward {
  title: string;
  summary: string;
  badge: string;
  icon: CompletionBadgeIcon;
}

interface CompletionSummary {
  lab: LabCard;
  reward: CompletionReward;
  nextLab: LabCard | null;
  badges: readonly CompletionBadge[];
}

type CompletionBadgeIcon = 'shield' | 'medal' | 'pipeline' | 'process' | 'signal';

interface CompletionBadge {
  labId: string;
  label: string;
  icon: CompletionBadgeIcon;
  unlocked: boolean;
}

const REWARDS: Record<string, CompletionReward> = {
  'lab-01': {
    title: 'Filesystem Scout',
    summary: 'You found the mission file and mapped your first Linux workspace.',
    badge: 'Mission Finder',
    icon: 'shield',
  },
  'lab-02': {
    title: 'Permission Scout',
    summary: 'You inspected deploy.sh and made it executable inside a real Linux sandbox.',
    badge: 'Permission Keeper',
    icon: 'medal',
  },
  'lab-03': {
    title: 'Pipeline Scout',
    summary: 'You filtered logs with grep and counted errors through a shell pipeline.',
    badge: 'Stream Reader',
    icon: 'pipeline',
  },
  'lab-04': {
    title: 'Process Scout',
    summary: 'You started, found, and stopped a background process from the terminal.',
    badge: 'Process Watcher',
    icon: 'process',
  },
  'lab-05': {
    title: 'Signal Scout',
    summary: 'You launched a process and stopped it gracefully with a Unix signal.',
    badge: 'Signal Handler',
    icon: 'signal',
  },
};

@Component({
  selector: 'sc-complete-page',
  templateUrl: './complete.page.html',
})
export class CompletePage {
  private readonly router = inject(Router);
  private readonly progress = inject(LabProgress);

  protected readonly completion = computed<CompletionSummary | null>(() => {
    const lab = this.progress.latestCompletedLab();
    if (!lab) {
      return null;
    }

    return {
      lab,
      reward: REWARDS[lab.id] ?? {
        title: `${lab.title} Scout`,
        summary: lab.description,
        badge: 'ShellCraft Badge',
        icon: 'shield',
      },
      nextLab: this.progress.nextLab(),
      badges: this.progress.labs().map((item) => ({
        labId: item.id,
        label: REWARDS[item.id]?.badge ?? item.title,
        icon: REWARDS[item.id]?.icon ?? 'shield',
        unlocked: this.progress.isCompleted(item.id),
      })),
    };
  });

  protected startFirstLab(): void {
    void this.router.navigate(['/lab', DEFAULT_LAB_ID]);
  }

  protected continueNext(): void {
    const nextLab = this.completion()?.nextLab;
    void this.router.navigate(nextLab ? ['/lab', nextLab.id] : ['/path']);
  }

  protected backToPath(): void {
    void this.router.navigate(['/path']);
  }
}
