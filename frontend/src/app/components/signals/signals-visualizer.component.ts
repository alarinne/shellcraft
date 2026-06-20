import { Component, signal } from '@angular/core';
import { applySignal, PosixSignal, Proc, SIGNALS } from './process-signals';

const INITIAL: Proc[] = [
  { pid: 1042, name: 'web-server', status: 'running', catchable: true },
  { pid: 2087, name: 'log-shipper', status: 'running', catchable: true },
  { pid: 3310, name: 'runaway-loop', status: 'running', catchable: false },
];

/**
 * Interactive process/signals lab: pick a signal, send it to a process, and see
 * how it responds — the difference between a graceful SIGTERM and a forced
 * SIGKILL — with an explanation log.
 */
@Component({
  selector: 'sc-signals-visualizer',
  templateUrl: './signals-visualizer.component.html',
  styleUrl: './signals-visualizer.component.scss',
})
export class SignalsVisualizerComponent {
  protected readonly signals = SIGNALS;
  protected readonly processes = signal<Proc[]>(structuredCloneSafe(INITIAL));
  protected readonly selected = signal<PosixSignal>('SIGTERM');
  protected readonly log = signal<string[]>([]);

  protected select(signal: PosixSignal): void {
    this.selected.set(signal);
  }

  protected send(pid: number): void {
    const sig = this.selected();
    this.processes.update((list) =>
      list.map((p) => {
        if (p.pid !== pid) {
          return p;
        }
        const outcome = applySignal(p, sig);
        this.log.update((entries) => [outcome.message, ...entries].slice(0, 8));
        return outcome.proc;
      }),
    );
  }

  protected reset(): void {
    this.processes.set(structuredCloneSafe(INITIAL));
    this.log.set([]);
  }
}

function structuredCloneSafe(procs: Proc[]): Proc[] {
  return procs.map((p) => ({ ...p }));
}
