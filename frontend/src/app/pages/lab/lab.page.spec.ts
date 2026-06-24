import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { EXECUTION_BACKEND } from '../../core/execution/execution-backend';
import { LabEngine } from '../../core/execution/lab-engine';
import { SimulatedBackend } from '../../core/execution/simulated-backend';
import { LabProgress } from '../../core/progress/lab-progress';
import { DockerLabSession } from '../../core/sandbox/docker-lab-session';
import { LabPage } from './lab.page';

function dockerSessionStub() {
  return {
    start: vi.fn().mockResolvedValue(false),
    stop: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn().mockResolvedValue(undefined),
    applyCheckResult: vi.fn(),
    setCwd: vi.fn(),
    setLiveState: vi.fn(),
    checkWork: vi.fn().mockResolvedValue(null),
    active: signal(false).asReadonly(),
    sessionId: signal(null).asReadonly(),
    progress: signal(0).asReadonly(),
    stepsCompleted: signal(0).asReadonly(),
    totalSteps: signal(5).asReadonly(),
    completed: signal(false).asReadonly(),
    currentTaskPrompt: signal('').asReadonly(),
    cwd: signal('/home/guest/lab-01').asReadonly(),
    liveState: signal(null).asReadonly(),
    error: signal(null).asReadonly(),
    checkResult: signal(null).asReadonly(),
    stepStatuses: signal([]).asReadonly(),
  };
}

describe('LabPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabPage],
      providers: [
        provideRouter([]),
        { provide: EXECUTION_BACKEND, useClass: SimulatedBackend },
        { provide: DockerLabSession, useFactory: dockerSessionStub },
      ],
    }).compileComponents();
  });

  it('loads the default lab and shows the first command task', () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(TestBed.inject(LabEngine).lab()?.id).toBe('lab-01');
    expect(compiled.textContent).toContain('Check where this terminal session starts.');
    expect(compiled.querySelector('sc-terminal')).toBeTruthy();
    expect(compiled.textContent).toContain('0% complete');
    expect(compiled.textContent).toContain('0/5 steps cleared');
    expect(compiled.textContent).not.toContain('Feedback');
  });

  it('loads Lab 01 as a filesystem quest with the filesystem map', () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.componentRef.setInput('id', 'lab-01');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(TestBed.inject(LabEngine).lab()?.id).toBe('lab-01');
    expect(compiled.textContent).toContain('Filesystem Quest');
    expect(compiled.textContent).toContain('Check where this terminal session starts.');
    expect(compiled.textContent).toContain('Filesystem map');
    expect(compiled.textContent).toContain('labs');
    expect(compiled.textContent).not.toContain('deploy.sh');
    expect(compiled.textContent).not.toContain('README.md');
    expect(compiled.textContent).toContain('0/5 steps cleared');
    expect(compiled.textContent).not.toContain('Accepted');
    expect(compiled.textContent).not.toContain('Owner');
  });

  it('submits a typed command through LabEngine and advances the step', async () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.componentRef.setInput('id', 'lab-02');
    fixture.detectChanges();

    await submitCommand(fixture, 'ls -l');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('-rw-r--r-- 1 guest guest 913 deploy.sh');
    expect(compiled.textContent).toContain('Run chmod 755 deploy.sh');
    expect(compiled.textContent).toContain('50% complete');
    expect(TestBed.inject(LabEngine).currentStep()?.id).toBe('step-02-chmod');
  });

  it('records wrong commands without advancing', async () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.componentRef.setInput('id', 'lab-02');
    fixture.detectChanges();

    await submitCommand(fixture, 'sudo rm -rf /');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('shellcraft: not the expected command for this step');
    expect(compiled.querySelector('.sc-error-line')).toBeTruthy();
    expect(TestBed.inject(LabEngine).currentStep()?.id).toBe('step-01-inspect');
  });

  it('keeps completion disabled until all steps pass', async () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.componentRef.setInput('id', 'lab-02');
    fixture.detectChanges();

    expect(TestBed.inject(LabEngine).completed()).toBe(false);
    expect(completeButton(fixture.nativeElement).disabled).toBe(true);

    await submitCommand(fixture, 'ls -l');
    await submitCommand(fixture, 'chmod 755 deploy.sh');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Lab complete - every step cleared.');
    expect(completeButton(compiled).disabled).toBe(false);
  });

  it('navigates to the completion route only after the lab is complete', async () => {
    const fixture = TestBed.createComponent(LabPage);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentRef.setInput('id', 'lab-02');
    fixture.detectChanges();

    completeButton(fixture.nativeElement).click();
    expect(navigate).not.toHaveBeenCalled();
    expect(TestBed.inject(LabProgress).isCompleted('lab-02')).toBe(false);

    await submitCommand(fixture, 'ls -l');
    await submitCommand(fixture, 'chmod 755 deploy.sh');
    completeButton(fixture.nativeElement).click();

    expect(TestBed.inject(LabProgress).isCompleted('lab-02')).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/complete']);
  });

  it('runs the Lab 01 quest through the mission file step', async () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.componentRef.setInput('id', 'lab-01');
    fixture.detectChanges();

    await submitCommand(fixture, 'pwd');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Feedback');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'pwd prints the current working directory',
    );
    expect(TestBed.inject(LabEngine).currentStep()?.id).toBe('step-02-scan-projects');

    await submitCommand(fixture, 'ls -la');
    expect(TestBed.inject(LabEngine).currentStep()?.id).toBe('step-03-enter-labs');

    await submitCommand(fixture, 'cd labs');
    expect(TestBed.inject(LabEngine).state()?.cwd).toBe('/home/guest/lab-01/labs');
    expect(TestBed.inject(LabEngine).currentStep()?.id).toBe('step-04-find-mission');

    await submitCommand(fixture, 'ls -la');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('4/5 steps cleared');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('80% complete');

    await submitCommand(fixture, 'cat mission.txt');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('MISSION_READY=filesystem');
    expect(TestBed.inject(LabEngine).completed()).toBe(true);
    expect(completeButton(compiled).disabled).toBe(false);
  });
});

async function submitCommand(fixture: ComponentFixture<LabPage>, command: string): Promise<void> {
  const compiled = fixture.nativeElement as HTMLElement;
  const input = compiled.querySelector<HTMLInputElement>('input[aria-label="Terminal command"]');
  expect(input).toBeTruthy();
  input!.value = command;
  input!.dispatchEvent(new Event('input'));
  fixture.detectChanges();

  input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

  await fixture.whenStable();
  fixture.detectChanges();
}

function completeButton(compiled: HTMLElement): HTMLButtonElement {
  const button = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find((candidate) =>
    candidate.textContent?.includes('Complete lab'),
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}
