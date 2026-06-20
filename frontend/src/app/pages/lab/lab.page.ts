import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  COMMAND_DEMOS,
  CommandDemo,
  findLab,
  PERMISSION_ROWS,
} from '../../core/shellcraft-data';

@Component({
  selector: 'sc-lab-page',
  templateUrl: './lab.page.html',
})
export class LabPage {
  private readonly router = inject(Router);

  /** Bound from the `/lab/:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>();

  protected readonly lab = computed(() => findLab(this.id()));
  protected readonly commandDemos = COMMAND_DEMOS;
  protected readonly permissionRows = PERMISSION_ROWS;

  protected readonly selectedDemo = signal<CommandDemo>(COMMAND_DEMOS[1]);
  protected readonly promptLine = computed(
    () => `guest@shellcraft:~$ ${this.selectedDemo().command}`,
  );

  protected selectDemo(demo: CommandDemo): void {
    this.selectedDemo.set(demo);
  }

  protected completeLab(): void {
    void this.router.navigate(['/complete']);
  }
}
