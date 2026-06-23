import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TerminalEntry } from '../../core/execution/lab-engine';

@Component({
  selector: 'sc-terminal',
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.scss',
})
export class TerminalComponent implements AfterViewInit {
  readonly labTitle = input('');
  readonly prompt = input('guest@shellcraft:~$');
  readonly history = input<readonly TerminalEntry[]>([]);
  readonly acceptedCommands = input<readonly string[]>([]);
  readonly busy = input(false);
  readonly completed = input(false);

  readonly commandSubmit = output<string>();

  private readonly cmdInput = viewChild<ElementRef<HTMLInputElement>>('cmdInput');
  private readonly terminalBody = viewChild<ElementRef<HTMLElement>>('terminalBody');

  protected readonly command = signal('');
  private readonly enteredCommands = signal<string[]>([]);
  private recallIndex = -1;

  constructor() {
    effect(() => {
      this.history();
      this.busy();
      queueMicrotask(() => {
        this.scrollToBottom();
        if (!this.busy() && !this.completed()) {
          this.focusInput();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  protected setCommand(value: string): void {
    this.command.set(value);
  }

  protected focusInput(): void {
    const input = this.cmdInput()?.nativeElement;
    if (input && !this.completed()) {
      input.focus();
    }
  }

  protected runCommand(): void {
    const command = this.command().trim();
    if (!command || this.busy() || this.completed()) {
      return;
    }

    this.enteredCommands.update((commands) => [...commands, command]);
    this.recallIndex = -1;
    this.syncInputValue('');
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

    this.syncInputValue(this.recallIndex === -1 ? '' : commands[this.recallIndex]);
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

    this.syncInputValue(candidates.length === 1 ? candidates[0] : commonPrefix(candidates));
  }

  private syncInputValue(value: string): void {
    this.command.set(value);
    const input = this.cmdInput()?.nativeElement;
    if (input) {
      input.value = value;
    }
  }

  private scrollToBottom(): void {
    const body = this.terminalBody()?.nativeElement;
    if (body) {
      body.scrollTop = body.scrollHeight;
    }
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
