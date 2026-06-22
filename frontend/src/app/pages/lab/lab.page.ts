import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TerminalComponent } from '../../components/terminal/terminal.component';
import { CommandResult, Lab, LabFile } from '../../core/execution/types';
import { LabEngine } from '../../core/execution/lab-engine';
import { getLab } from '../../core/labs';
import { LAB_02_PERMISSIONS } from '../../core/labs/lab-02-permissions';

interface PermissionRow {
  role: 'Owner' | 'Group' | 'Others';
  value: string;
  tone: 'blue' | 'purple' | 'orange';
}

const DEFAULT_LAB: Lab = LAB_02_PERMISSIONS;

@Component({
  selector: 'sc-lab-page',
  imports: [TerminalComponent],
  templateUrl: './lab.page.html',
})
export class LabPage {
  private readonly router = inject(Router);
  protected readonly engine = inject(LabEngine);

  /** Bound from the `/lab/:id` route param via `withComponentInputBinding()`. */
  readonly id = input<string>();

  protected readonly hintVisible = signal(false);
  protected readonly busy = signal(false);
  protected readonly lastResult = signal<CommandResult | null>(null);

  protected readonly lab = computed(() => getLab(this.id()) ?? DEFAULT_LAB);
  protected readonly progressPercent = computed(() => Math.round(this.engine.progress() * 100));
  protected readonly focusFile = computed(() => this.engine.state()?.files[0] ?? null);
  protected readonly prompt = computed(
    () => `guest@shellcraft:${this.engine.state()?.cwd ?? '~'}$`,
  );
  protected readonly permissionRows = computed<PermissionRow[]>(() => {
    const [owner, group, others] = splitPermissions(this.focusFile()?.permissions);
    return [
      { role: 'Owner', value: owner, tone: 'blue' },
      { role: 'Group', value: group, tone: 'purple' },
      { role: 'Others', value: others, tone: 'orange' },
    ];
  });
  protected readonly explanation = computed(
    () =>
      (this.lastResult()?.correct === false ? this.lastResult()?.explanation : undefined) ??
      this.engine.currentStep()?.explanation ??
      this.lastResult()?.explanation ??
      'Every command result will appear in the terminal.',
  );

  constructor() {
    effect(() => {
      this.engine.load(this.lab());
      this.hintVisible.set(false);
      this.lastResult.set(null);
    });
  }

  protected async submitCommand(command: string): Promise<void> {
    if (this.busy() || this.engine.completed()) {
      return;
    }

    this.busy.set(true);
    try {
      const result = await this.engine.submit(command);
      this.lastResult.set(result);
      if (result?.correct) {
        this.hintVisible.set(false);
      }
    } finally {
      this.busy.set(false);
    }
  }

  protected toggleHint(): void {
    this.hintVisible.update((visible) => !visible);
  }

  protected reset(): void {
    this.engine.reset();
    this.hintVisible.set(false);
    this.lastResult.set(null);
  }

  protected fileName(file: LabFile | null): string {
    if (!file) {
      return 'workspace';
    }
    return file.path.split('/').pop() ?? file.path;
  }

  protected completeLab(): void {
    if (!this.engine.completed()) {
      return;
    }

    void this.router.navigate(['/complete']);
  }
}

function splitPermissions(permissions = '---------'): [string, string, string] {
  const normalized = permissions.slice(-9).padStart(9, '-');
  return [
    normalized.slice(0, 3),
    normalized.slice(3, 6),
    normalized.slice(6, 9),
  ];
}
