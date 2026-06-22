import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { EXECUTION_BACKEND } from '../../core/execution/execution-backend';
import { LabEngine } from '../../core/execution/lab-engine';
import { SimulatedBackend } from '../../core/execution/simulated-backend';
import { LabPage } from './lab.page';

describe('LabPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabPage],
      providers: [
        provideRouter([]),
        { provide: EXECUTION_BACKEND, useClass: SimulatedBackend },
      ],
    }).compileComponents();
  });

  it('loads the default lab and shows the first command task', () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(TestBed.inject(LabEngine).lab()?.id).toBe('lab-02');
    expect(compiled.textContent).toContain('Inspect the current permissions of deploy.sh');
    expect(compiled.querySelector('sc-terminal')).toBeTruthy();
    expect(compiled.textContent).toContain('0% complete');
  });

  it('submits a typed command through LabEngine and advances the step', async () => {
    const fixture = TestBed.createComponent(LabPage);
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
    fixture.detectChanges();

    await submitCommand(fixture, 'sudo rm -rf /');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('shellcraft: not the expected command for this step');
    expect(compiled.querySelector('.sc-error-line')).toBeTruthy();
    expect(TestBed.inject(LabEngine).currentStep()?.id).toBe('step-01-inspect');
  });

  it('keeps completion disabled until all steps pass', async () => {
    const fixture = TestBed.createComponent(LabPage);
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
    fixture.detectChanges();

    completeButton(fixture.nativeElement).click();
    expect(navigate).not.toHaveBeenCalled();

    await submitCommand(fixture, 'ls -l');
    await submitCommand(fixture, 'chmod 755 deploy.sh');
    completeButton(fixture.nativeElement).click();

    expect(navigate).toHaveBeenCalledWith(['/complete']);
  });
});

async function submitCommand(fixture: ComponentFixture<LabPage>, command: string): Promise<void> {
  const compiled = fixture.nativeElement as HTMLElement;
  const input = compiled.querySelector<HTMLInputElement>('input[aria-label="Terminal command"]');
  expect(input).toBeTruthy();
  input!.value = command;
  input!.dispatchEvent(new Event('input'));
  fixture.detectChanges();

  const button = compiled.querySelector<HTMLButtonElement>('button[aria-label="Run command"]');
  expect(button).toBeTruthy();
  button!.click();

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
