import { TestBed } from '@angular/core/testing';
import { commonPrefix, TerminalComponent } from './terminal.component';

describe('commonPrefix', () => {
  it('returns the longest shared leading substring', () => {
    expect(commonPrefix(['ls -l', 'ls -la'])).toBe('ls -l');
    expect(commonPrefix(['pwd', 'stat'])).toBe('');
    expect(commonPrefix([])).toBe('');
  });
});

describe('TerminalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminalComponent],
    }).compileComponents();
  });

  it('emits a typed command and clears the input', () => {
    const fixture = TestBed.createComponent(TerminalComponent);
    const submitted: string[] = [];
    fixture.componentInstance.commandSubmit.subscribe((command) => submitted.push(command));
    fixture.detectChanges();

    setCommand(fixture.nativeElement, '  ls -l  ');
    fixture.detectChanges();
    clickRun(fixture.nativeElement);
    fixture.detectChanges();

    expect(submitted).toEqual(['ls -l']);
    expect(commandInput(fixture.nativeElement).value).toBe('');
  });

  it('marks wrong history entries as error lines', () => {
    const fixture = TestBed.createComponent(TerminalComponent);
    fixture.componentRef.setInput('history', [
      {
        prompt: 'guest@shellcraft:/home/guest/projects$',
        command: 'rm -rf /',
        output: ['shellcraft: not the expected command for this step'],
        correct: false,
      },
    ]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.sc-error-line')).toBeTruthy();
  });

  it('autocompletes from accepted commands', () => {
    const fixture = TestBed.createComponent(TerminalComponent);
    fixture.componentRef.setInput('acceptedCommands', ['ls -l', 'ls -l deploy.sh']);
    fixture.detectChanges();

    const input = commandInput(fixture.nativeElement);
    input.value = 'ls';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    fixture.detectChanges();

    expect(commandInput(fixture.nativeElement).value).toBe('ls -l');
  });
});

function commandInput(compiled: HTMLElement): HTMLInputElement {
  const input = compiled.querySelector<HTMLInputElement>('input[aria-label="Terminal command"]');
  expect(input).toBeTruthy();
  return input as HTMLInputElement;
}

function setCommand(compiled: HTMLElement, command: string): void {
  const input = commandInput(compiled);
  input.value = command;
  input.dispatchEvent(new Event('input'));
}

function clickRun(compiled: HTMLElement): void {
  const button = compiled.querySelector<HTMLButtonElement>('button[aria-label="Run command"]');
  expect(button).toBeTruthy();
  button?.click();
}
