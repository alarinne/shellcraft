import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_LAB_ID, LEARNED_COMMANDS } from '../../core/shellcraft-data';

@Component({
  selector: 'sc-complete-page',
  templateUrl: './complete.page.html',
})
export class CompletePage {
  private readonly router = inject(Router);

  protected readonly learnedCommands = LEARNED_COMMANDS;

  protected continueNext(): void {
    void this.router.navigate(['/lab', DEFAULT_LAB_ID]);
  }

  protected backToPath(): void {
    void this.router.navigate(['/path']);
  }
}
