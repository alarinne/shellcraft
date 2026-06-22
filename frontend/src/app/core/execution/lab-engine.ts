import { computed, inject, Injectable, signal } from '@angular/core';
import { EXECUTION_BACKEND } from './execution-backend';
import { CommandResult, Lab, LabState, LabStep } from './types';

export interface TerminalEntry {
  prompt: string;
  command: string;
  output: string[];
  correct: boolean;
}

function cloneState(state: LabState): LabState {
  return {
    cwd: state.cwd,
    files: state.files.map((f) => ({ ...f })),
    env: state.env ? { ...state.env } : undefined,
  };
}

/**
 * Drives a lab: tracks the active step, the simulated state, and terminal
 * history, delegating command evaluation to the active `ExecutionBackend`
 * (simulator by default; Docker sandbox when enabled — see ADR-0002).
 */
@Injectable({ providedIn: 'root' })
export class LabEngine {
  private readonly backend = inject(EXECUTION_BACKEND);

  private readonly _lab = signal<Lab | null>(null);
  private readonly _stepIndex = signal(0);
  private readonly _state = signal<LabState | null>(null);
  private readonly _history = signal<TerminalEntry[]>([]);

  readonly lab = this._lab.asReadonly();
  readonly state = this._state.asReadonly();
  readonly history = this._history.asReadonly();
  readonly stepIndex = this._stepIndex.asReadonly();

  readonly currentStep = computed<LabStep | null>(() => {
    const lab = this._lab();
    return lab ? (lab.steps[this._stepIndex()] ?? null) : null;
  });

  readonly completed = computed(() => {
    const lab = this._lab();
    return !!lab && this._stepIndex() >= lab.steps.length;
  });

  readonly progress = computed(() => {
    const lab = this._lab();
    if (!lab || lab.steps.length === 0) {
      return 0;
    }
    return Math.min(1, this._stepIndex() / lab.steps.length);
  });

  readonly totalSteps = computed(() => this._lab()?.steps.length ?? 0);

  /** Accepted commands for the active step (used for autocomplete). */
  readonly acceptedCommands = computed(() => this.currentStep()?.acceptedCommands ?? []);

  load(lab: Lab, options: { force?: boolean } = {}): void {
    const currentLab = this._lab();
    if (!options.force && currentLab?.id === lab.id && this._state()) {
      return;
    }

    this._lab.set(lab);
    this._stepIndex.set(0);
    this._state.set(cloneState(lab.initialState));
    this._history.set([]);
  }

  /** Evaluate a command, advancing the lab on success. No-op once completed. */
  async submit(command: string): Promise<CommandResult | null> {
    const step = this.currentStep();
    const state = this._state();
    if (!step || !state) {
      return null;
    }

    const prompt = `guest@shellcraft:${state.cwd}$`;
    const result = await this.backend.run(command, { step, state });

    if (result.newState) {
      this._state.set(result.newState);
    }
    this._history.update((entries) => [
      ...entries,
      { prompt, command, output: result.output, correct: result.correct },
    ]);
    if (result.correct) {
      this._stepIndex.update((i) => i + 1);
    }
    return result;
  }

  reset(): void {
    const lab = this._lab();
    if (lab) {
      this.load(lab, { force: true });
    }
  }
}
