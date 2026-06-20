import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { LabEngine } from '../../core/execution/lab-engine';

/**
 * Interactive terminal bound to {@link LabEngine}. Supports typing a command,
 * Enter to run, ↑/↓ to recall command history, and Tab to autocomplete against
 * the active step's accepted commands. Output is appended to the scrollback.
 */
@Component({
  selector: 'sc-terminal',
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.scss',
})
export class TerminalComponent {
  protected readonly engine = inject(LabEngine);

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('cmdInput');

  protected readonly input = signal('');
  /** Commands the user has entered, for ↑/↓ recall. */
  private readonly entered = signal<string[]>([]);
  private recallIndex = -1;
  protected readonly busy = signal(false);

  protected readonly prompt = computed(() => {
    const cwd = this.engine.state()?.cwd ?? '~';
    return `guest@shellcraft:${cwd}$`;
  });

  protected setInput(value: string): void {
    this.input.set(value);
  }

  protected async onEnter(): Promise<void> {
    const command = this.input().trim();
    if (!command || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.entered.update((list) => [...list, command]);
    this.recallIndex = -1;
    this.input.set('');
    try {
      await this.engine.submit(command);
    } finally {
      this.busy.set(false);
      queueMicrotask(() => this.focusInput());
    }
  }

  protected recall(direction: -1 | 1): void {
    const list = this.entered();
    if (list.length === 0) {
      return;
    }
    if (this.recallIndex === -1) {
      this.recallIndex = direction === -1 ? list.length - 1 : -1;
    } else {
      this.recallIndex = Math.min(list.length - 1, Math.max(-1, this.recallIndex + direction));
    }
    this.input.set(this.recallIndex === -1 ? '' : list[this.recallIndex]);
  }

  /** Tab completion against the active step's accepted commands. */
  protected complete(): void {
    const value = this.input().trim();
    const candidates = this.engine.acceptedCommands().filter((c) => c.startsWith(value));
    if (candidates.length === 0) {
      return;
    }
    this.input.set(candidates.length === 1 ? candidates[0] : commonPrefix(candidates));
  }

  private focusInput(): void {
    this.inputEl()?.nativeElement.focus();
  }
}

/** Longest shared leading substring across the candidates. */
export function commonPrefix(values: string[]): string {
  if (values.length === 0) {
    return '';
  }
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) {
        return '';
      }
    }
  }
  return prefix;
}
