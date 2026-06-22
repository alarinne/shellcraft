import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_LAB_ID, LEARNED_COMMANDS, NEXT_LAB_ID } from '../../core/shellcraft-data';
import { LabProgress } from '../../core/progress/lab-progress';

@Component({
  selector: 'sc-complete-page',
  templateUrl: './complete.page.html',
})
export class CompletePage {
  private readonly router = inject(Router);
  private readonly progress = inject(LabProgress);

  protected readonly completed = computed(() => this.progress.isCompleted(DEFAULT_LAB_ID));
  protected readonly learnedCommands = LEARNED_COMMANDS;

  protected startFirstLab(): void {
    void this.router.navigate(['/lab', DEFAULT_LAB_ID]);
  }

  protected continueNext(): void {
    void this.router.navigate(['/lab', NEXT_LAB_ID]);
  }

  protected backToPath(): void {
    void this.router.navigate(['/path']);
  }
}
