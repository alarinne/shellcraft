import { TestBed } from '@angular/core/testing';
import { commonPrefix, TerminalComponent } from './terminal.component';
import { EXECUTION_BACKEND } from '../../core/execution/execution-backend';
import { LabEngine } from '../../core/execution/lab-engine';
import { SimulatedBackend } from '../../core/execution/simulated-backend';
import { LAB_02_PERMISSIONS } from '../../core/labs/lab-02-permissions';

describe('commonPrefix', () => {
  it('returns the longest shared leading substring', () => {
    expect(commonPrefix(['ls -l', 'ls -l deploy.sh'])).toBe('ls -l');
    expect(commonPrefix(['ls', 'stat'])).toBe('');
    expect(commonPrefix([])).toBe('');
  });
});

describe('TerminalComponent', () => {
  let engine: LabEngine;

  function create() {
    const fixture = TestBed.createComponent(TerminalComponent);
    fixture.detectChanges();
    // Access protected members for deterministic logic tests.
    const cmp = fixture.componentInstance as unknown as {
      input: { (): string; set(v: string): void };
      onEnter(): Promise<void>;
      recall(dir: -1 | 1): void;
      complete(): void;
    };
    return { fixture, cmp };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EXECUTION_BACKEND, useClass: SimulatedBackend }],
    });
    engine = TestBed.inject(LabEngine);
    engine.load(LAB_02_PERMISSIONS);
  });

  it('runs an accepted command, appends output, and advances the step', async () => {
    const { fixture, cmp } = create();
    cmp.input.set('ls -l');
    await cmp.onEnter();
    fixture.detectChanges();

    expect(engine.history()).toHaveLength(1);
    expect(engine.currentStep()?.id).toBe('step-02-chmod');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '-rw-r--r-- 1 guest guest 913 deploy.sh',
    );
  });

  it('shows an error line for a wrong command and does not advance', async () => {
    const { fixture, cmp } = create();
    cmp.input.set('sudo rm -rf /');
    await cmp.onEnter();
    fixture.detectChanges();

    expect(engine.currentStep()?.id).toBe('step-01-inspect');
    expect((fixture.nativeElement as HTMLElement).querySelector('.sc-error-line')).toBeTruthy();
  });

  it('recalls the previous command with the up arrow', async () => {
    const { cmp } = create();
    cmp.input.set('ls -l');
    await cmp.onEnter();
    expect(cmp.input()).toBe('');
    cmp.recall(-1);
    expect(cmp.input()).toBe('ls -l');
  });

  it('autocompletes against the active step accepted commands', () => {
    const { cmp } = create();
    cmp.input.set('ls');
    cmp.complete();
    expect(cmp.input()).toBe('ls -l');
  });
});
