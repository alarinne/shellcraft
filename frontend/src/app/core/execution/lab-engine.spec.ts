import { TestBed } from '@angular/core/testing';
import { EXECUTION_BACKEND } from './execution-backend';
import { LabEngine } from './lab-engine';
import { SimulatedBackend } from './simulated-backend';
import { LAB_02_PERMISSIONS } from '../labs/lab-02-permissions';

describe('LabEngine', () => {
  let engine: LabEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LabEngine, { provide: EXECUTION_BACKEND, useClass: SimulatedBackend }],
    });
    engine = TestBed.inject(LabEngine);
    engine.load(LAB_02_PERMISSIONS);
  });

  it('starts at the first step with a fresh state', () => {
    expect(engine.currentStep()?.id).toBe('step-01-inspect');
    expect(engine.completed()).toBe(false);
    expect(engine.progress()).toBe(0);
    expect(engine.state()?.files[0].permissions).toBe('rw-r--r--');
  });

  it('does not advance on a wrong command but records history', async () => {
    const result = await engine.submit('rm -rf /');
    expect(result?.correct).toBe(false);
    expect(engine.currentStep()?.id).toBe('step-01-inspect');
    expect(engine.history()).toHaveLength(1);
    expect(engine.history()[0].prompt).toBe('guest@shellcraft:/home/guest/lab-02$');
  });

  it('advances through steps and completes the lab', async () => {
    await engine.submit('ls -l');
    expect(engine.currentStep()?.id).toBe('step-02-chmod');

    const result = await engine.submit('chmod 755 deploy.sh');
    expect(result?.correct).toBe(true);
    expect(engine.completed()).toBe(true);
    expect(engine.progress()).toBe(1);
    // state reflects the chmod
    expect(engine.state()?.files[0].permissions).toBe('rwxr-xr-x');
  });

  it('reset returns to the initial step and state', async () => {
    await engine.submit('ls -l');
    engine.reset();
    expect(engine.currentStep()?.id).toBe('step-01-inspect');
    expect(engine.history()).toHaveLength(0);
  });

  it('preserves progress when the same lab is loaded again', async () => {
    await engine.submit('ls -l');

    engine.load(LAB_02_PERMISSIONS);

    expect(engine.currentStep()?.id).toBe('step-02-chmod');
    expect(engine.history()).toHaveLength(1);
    expect(engine.progress()).toBe(0.5);
  });
});
