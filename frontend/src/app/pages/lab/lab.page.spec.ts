import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LabPage } from './lab.page';
import { EXECUTION_BACKEND } from '../../core/execution/execution-backend';
import { LabEngine } from '../../core/execution/lab-engine';
import { SimulatedBackend } from '../../core/execution/simulated-backend';

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

  it('loads the default lab and shows the first step prompt + terminal', () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(TestBed.inject(LabEngine).lab()?.id).toBe('lab-02');
    expect(compiled.textContent).toContain('Inspect the current permissions of deploy.sh');
    expect(compiled.querySelector('sc-terminal')).toBeTruthy();
  });

  it('keeps the Complete button disabled until the lab is finished', async () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.detectChanges();
    const engine = TestBed.inject(LabEngine);

    const completeBtn = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Complete lab')) as HTMLButtonElement;
    expect(completeBtn.disabled).toBe(true);

    await engine.submit('ls -l');
    await engine.submit('chmod 755 deploy.sh');
    fixture.detectChanges();
    expect(completeBtn.disabled).toBe(false);
  });
});
