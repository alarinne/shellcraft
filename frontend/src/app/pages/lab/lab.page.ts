import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TerminalComponent } from '../../components/terminal/terminal.component';
import { FilesystemMapComponent } from '../../components/visualizer/filesystem-map.component';
import { PermissionGridComponent } from '../../components/visualizer/permission-grid.component';
import { LabEngine } from '../../core/execution/lab-engine';
import { getLab } from '../../core/labs';
import { LAB_02_PERMISSIONS } from '../../core/labs/lab-02-permissions';

@Component({
  selector: 'sc-lab-page',
  imports: [TerminalComponent, FilesystemMapComponent, PermissionGridComponent],
  templateUrl: './lab.page.html',
})
export class LabPage {
  private readonly router = inject(Router);
  protected readonly engine = inject(LabEngine);

  /** Bound from the `/lab/:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>();

  protected readonly hintVisible = signal(false);

  protected readonly progressPercent = computed(() => Math.round(this.engine.progress() * 100));

  /** Which visualizer the current step wants to highlight. */
  protected readonly visualFocus = computed(() => this.engine.currentStep()?.visual?.focus);

  /** File the permission visualizer should display (first file in state). */
  protected readonly focusFile = computed(() => this.engine.state()?.files[0]);

  protected fileName(path: string): string {
    return path.split('/').pop() ?? path;
  }

  protected toggleHint(): void {
    this.hintVisible.update((v) => !v);
  }

  constructor() {
    // Load (or reload) the lab whenever the route id changes.
    effect(() => {
      const lab = getLab(this.id()) ?? LAB_02_PERMISSIONS;
      this.engine.load(lab);
    });
  }

  protected reset(): void {
    this.engine.reset();
  }

  protected completeLab(): void {
    void this.router.navigate(['/complete']);
  }
}
