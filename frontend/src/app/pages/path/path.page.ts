import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LabCard } from '../../core/shellcraft-data';
import { LabProgress } from '../../core/progress/lab-progress';

@Component({
  selector: 'sc-path-page',
  templateUrl: './path.page.html',
})
export class PathPage {
  private readonly router = inject(Router);
  private readonly progress = inject(LabProgress);

  protected readonly stats = this.progress.stats;
  protected readonly labs = this.progress.labs;

  protected startLab(lab: LabCard): void {
    if (lab.locked) {
      return;
    }
    void this.router.navigate(['/lab', lab.id]);
  }
}
