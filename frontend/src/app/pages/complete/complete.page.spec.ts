import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../../core/auth/auth-storage';
import { EXECUTION_BACKEND } from '../../core/execution/execution-backend';
import { LabEngine } from '../../core/execution/lab-engine';
import { SimulatedBackend } from '../../core/execution/simulated-backend';
import { LAB_01_FILESYSTEM } from '../../core/labs/lab-01-filesystem';
import { LAB_02_PERMISSIONS } from '../../core/labs/lab-02-permissions';
import { LabProgress } from '../../core/progress/lab-progress';
import { CompletePage } from './complete.page';

@Component({
  selector: 'sc-empty-route',
  template: '',
})
class EmptyRouteComponent {}

describe('CompletePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletePage, EmptyRouteComponent],
      providers: [
        provideRouter([{ path: 'lab/:id', component: EmptyRouteComponent }]),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
        { provide: EXECUTION_BACKEND, useClass: SimulatedBackend },
      ],
    }).compileComponents();
  });

  it('renders an empty progress state when no lab is complete', () => {
    const fixture = TestBed.createComponent(CompletePage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No labs completed yet');
    expect(compiled.textContent).toContain('0 XP');
    expect(compiled.textContent).toContain('None yet');
    expect(compiled.textContent).not.toContain('Filesystem Scout');
  });

  it('keeps rewards hidden until completion is claimed', async () => {
    await completeLabOne();

    const fixture = TestBed.createComponent(CompletePage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No labs completed yet');
    expect(compiled.textContent).not.toContain('Filesystem Scout');
  });

  it('renders the completion reward summary after completion is claimed', async () => {
    await claimLabOne();

    const fixture = TestBed.createComponent(CompletePage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Filesystem Scout');
    expect(compiled.textContent).toContain('Mission Finder');
    expect(compiled.textContent).toContain('+120 XP');
  });

  it('renders the latest completed lab reward summary', async () => {
    await claimLabOne();
    TestBed.inject(LabProgress).complete(LAB_02_PERMISSIONS);

    const fixture = TestBed.createComponent(CompletePage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Permission Scout');
    expect(compiled.textContent).toContain('Permission Keeper');
    expect(compiled.textContent).toContain('+150 XP');
    expect(compiled.textContent).toContain('chmod');
    expect(compiled.textContent).not.toContain('Filesystem Scout');
    expect(compiled.querySelectorAll('.sc-complete-badge-dot.is-unlocked').length).toBe(2);
  });

  it('hides rewards again after claimed progress is reset', async () => {
    await claimLabOne();
    TestBed.inject(LabProgress).resetLab(LAB_01_FILESYSTEM.id);

    const fixture = TestBed.createComponent(CompletePage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No labs completed yet');
    expect(compiled.textContent).not.toContain('Filesystem Scout');
  });
});

async function claimLabOne(): Promise<void> {
  await completeLabOne();
  TestBed.inject(LabProgress).complete(LAB_01_FILESYSTEM);
}

async function completeLabOne(): Promise<LabEngine> {
  const engine = TestBed.inject(LabEngine);
  engine.load(LAB_01_FILESYSTEM);
  await engine.submit('pwd');
  await engine.submit('ls -la');
  await engine.submit('cd labs');
  await engine.submit('ls -la');
  await engine.submit('cat mission.txt');
  expect(engine.completed()).toBe(true);
  return engine;
}
