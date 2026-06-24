import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LABS, LabCard } from '../../core/shellcraft-data';
import { LabProgress } from '../../core/progress/lab-progress';

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
  private readonly auth = inject(AuthService);
  private readonly progress = inject(LabProgress);

  protected readonly authenticated = this.auth.isAuthenticated;
  protected readonly stats = this.progress.stats;
  protected readonly labs = this.progress.labs;
  protected readonly roadmapLabs = ROADMAP_LABS;
  protected readonly totalRoadmapXp = TOTAL_ROADMAP_XP;

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
}
