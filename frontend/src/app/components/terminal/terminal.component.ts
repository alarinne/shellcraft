import { Component, computed, input, output, signal } from '@angular/core';
import { TerminalEntry } from '../../core/execution/lab-engine';

@Component({
  selector: 'sc-terminal',
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.scss',
})
export class TerminalComponent {
  readonly labTitle = input('');
  readonly prompt = input('guest@shellcraft:~$');
  readonly history = input<readonly TerminalEntry[]>([]);
  readonly acceptedCommands = input<readonly string[]>([]);
  readonly busy = input(false);
  readonly completed = input(false);

  readonly commandSubmit = output<string>();

  protected readonly command = signal('');
  private readonly enteredCommands = signal<string[]>([]);
  private recallIndex = -1;

  protected readonly canSubmit = computed(
    () => this.command().trim().length > 0 && !this.busy() && !this.completed(),
  );

  protected setCommand(value: string): void {
    this.command.set(value);
  }

  protected runCommand(): void {
    const command = this.command().trim();
    if (!command || this.busy() || this.completed()) {
      return;
    }

    this.enteredCommands.update((commands) => [...commands, command]);
    this.recallIndex = -1;
    this.command.set('');
    this.commandSubmit.emit(command);
  }

  protected recall(direction: -1 | 1): void {
    const commands = this.enteredCommands();
    if (commands.length === 0) {
      return;
    }

    if (this.recallIndex === -1) {
      this.recallIndex = direction === -1 ? commands.length - 1 : -1;
    } else {
      this.recallIndex = Math.min(commands.length - 1, Math.max(-1, this.recallIndex + direction));
    }

    this.command.set(this.recallIndex === -1 ? '' : commands[this.recallIndex]);
  }

  protected autocomplete(): void {
    const value = this.command().trim();
    if (!value) {
      return;
    }

    const candidates = this.acceptedCommands().filter((command) => command.startsWith(value));
    if (candidates.length === 0) {
      return;
    }

    this.command.set(candidates.length === 1 ? candidates[0] : commonPrefix(candidates));
  }
}

export function commonPrefix(values: readonly string[]): string {
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
