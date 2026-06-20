import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LABS, LabCard } from '../../core/shellcraft-data';
import { ProgressService } from '../../core/progress/progress.service';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

@Component({
  selector: 'sc-path-page',
  templateUrl: './path.page.html',
})
export class PathPage {
  private readonly router = inject(Router);
  private readonly progress = inject(ProgressService);

  protected readonly labs = LABS;

  /** Live stats from persisted progress. */
  protected readonly stats = computed(() => [
    { label: 'Labs', value: pad(this.progress.completedCount()) },
    { label: 'XP', value: this.progress.xp().toString() },
    { label: 'Streak', value: pad(this.progress.streak()) },
  ]);

  protected isCompleted(lab: LabCard): boolean {
    return this.progress.isCompleted(lab.id);
  }

  protected startLab(lab: LabCard): void {
    if (lab.locked) {
      return;
    }
    void this.router.navigate(['/lab', lab.id]);
  }
}
