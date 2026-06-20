import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { COMMAND_DEMOS, CommandDemo, DEFAULT_LAB_ID } from '../../core/shellcraft-data';

@Component({
  selector: 'sc-landing-page',
  templateUrl: './landing.page.html',
})
export class LandingPage {
  private readonly router = inject(Router);

  protected readonly demo = signal<CommandDemo>(COMMAND_DEMOS[1]);
  protected readonly promptLine = computed(() => `guest@shellcraft:~$ ${this.demo().command}`);

  protected startLearning(): void {
    void this.router.navigate(['/lab', DEFAULT_LAB_ID]);
  }

  protected viewLabs(): void {
    void this.router.navigate(['/path']);
  }
}
