import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LABS, LabCard, STATS } from '../../core/shellcraft-data';

@Component({
  selector: 'sc-path-page',
  templateUrl: './path.page.html',
})
export class PathPage {
  private readonly router = inject(Router);

  protected readonly stats = STATS;
  protected readonly labs = LABS;

  protected startLab(lab: LabCard): void {
    if (lab.locked) {
      return;
    }
    void this.router.navigate(['/lab', lab.id]);
  }
}
