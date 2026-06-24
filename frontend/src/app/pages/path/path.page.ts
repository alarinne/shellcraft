import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LAB_ORDER } from '../../core/progress/lab-progress';
import { LABS, LabCard } from '../../core/shellcraft-data';
import { LabProgress } from '../../core/progress/lab-progress';

interface LearningPathEntry {
  slug: string;
  status: 'done' | 'current' | 'next' | 'locked';
}

const LEARNING_PATH_SLUGS: Record<string, string> = {
  'lab-01': 'lab_01_filesystem',
  'lab-02': 'lab_02_permissions',
  'lab-03': 'lab_03_pipes',
  'lab-04': 'lab_04_processes',
  'lab-05': 'lab_05_signals',
};

interface RoadmapLab extends LabCard {
  node: string;
  requiresNode?: string;
  side: 'left' | 'right';
  primary: boolean;
}

const ROADMAP_LABS: readonly RoadmapLab[] = LABS.map((lab, index) => ({
  ...lab,
  node: String(index + 1).padStart(2, '0'),
  requiresNode: index > 0 ? String(index).padStart(2, '0') : undefined,
  side: index % 2 === 0 ? 'left' : 'right',
  primary: index === 0,
}));

const TOTAL_ROADMAP_XP = ROADMAP_LABS.reduce((total, lab) => total + lab.xp, 0);

@Component({
  selector: 'sc-path-page',
  templateUrl: './path.page.html',
})
export class PathPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly progress = inject(LabProgress);

  protected readonly authenticated = this.auth.isAuthenticated;
  protected readonly stats = this.progress.stats;
  protected readonly labs = this.progress.labs;
  protected readonly roadmapLabs = ROADMAP_LABS;
  protected readonly totalRoadmapXp = TOTAL_ROADMAP_XP;
  protected readonly allLabsCompleted = computed(() => this.progress.allLabsCompleted());

  protected readonly lockedNotice = computed(() => {
    const lockedId = this.route.snapshot.queryParamMap.get('locked');
    if (!lockedId) {
      return null;
    }
    const index = LAB_ORDER.indexOf(lockedId);
    if (index <= 0) {
      return null;
    }
    const priorId = LAB_ORDER[index - 1];
    const priorLab = LABS.find((lab) => lab.id === priorId);
    const lockedLab = LABS.find((lab) => lab.id === lockedId);
    if (!priorLab || !lockedLab) {
      return null;
    }
    return `Finish ${priorLab.title} before starting ${lockedLab.title}.`;
  });

  protected readonly whoamiLine = computed(() => {
    const user = this.auth.currentUser();
    if (!user) {
      return 'guest_student';
    }
    const name = user.name?.trim();
    return name || user.email;
  });

  protected readonly learningPathEntries = computed((): readonly LearningPathEntry[] =>
    this.labs().map((lab) => ({
      slug: LEARNING_PATH_SLUGS[lab.id] ?? lab.id.replace('-', '_'),
      status: learningPathStatus(lab.status),
    })),
  );

  protected startLab(lab: LabCard): void {
    if (lab.locked) {
      return;
    }
    void this.router.navigate(['/lab', lab.id]);
  }

  protected startGuestLab(): void {
    void this.router.navigate(['/auth'], {
      queryParams: { mode: 'register', returnUrl: '/lab/lab-01' },
    });
  }

  protected viewCertificate(): void {
    void this.router.navigate(['/certificate']);
  }
}

function learningPathStatus(status: string): LearningPathEntry['status'] {
  switch (status) {
    case 'Completed':
      return 'done';
    case 'Current':
      return 'current';
    case 'Next':
      return 'next';
    default:
      return 'locked';
  }
}
