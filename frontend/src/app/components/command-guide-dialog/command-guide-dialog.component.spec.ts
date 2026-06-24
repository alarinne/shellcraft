import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CommandGuideDialogComponent } from './command-guide-dialog.component';

describe('CommandGuideDialogComponent', () => {
  let fixture: ComponentFixture<CommandGuideDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandGuideDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandGuideDialogComponent);
  });

  it('renders abstract pattern and detail paragraphs', () => {
    fixture.componentRef.setInput('entry', {
      command: 'ls',
      pattern: 'ls [flags]',
      summary: 'List files and folders in the current directory.',
      detail: [
        'ls prints names in the directory you are in.',
        'Common flags:',
        '• -l (long) — extra columns',
      ],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ls [flags]');
    expect(compiled.textContent).toContain('Common flags:');
    expect(compiled.textContent).toContain('• -l (long)');
  });

  it('emits close when the close button is clicked', () => {
    fixture.componentRef.setInput('entry', {
      command: 'pwd',
      pattern: 'pwd',
      summary: 'Show your current folder.',
      detail: ['pwd prints the working directory.'],
    });
    fixture.detectChanges();

    const closeSpy = vi.fn();
    fixture.componentInstance.close.subscribe(closeSpy);
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.sc-dialog-close')
      ?.click();

    expect(closeSpy).toHaveBeenCalled();
  });
});
