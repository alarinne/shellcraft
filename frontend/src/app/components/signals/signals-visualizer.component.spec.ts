import { TestBed } from '@angular/core/testing';
import { SignalsVisualizerComponent } from './signals-visualizer.component';

describe('SignalsVisualizerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SignalsVisualizerComponent] }).compileComponents();
  });

  it('renders the signal picker and process table', () => {
    const fixture = TestBed.createComponent(SignalsVisualizerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('SIGTERM');
    expect(compiled.textContent).toContain('SIGKILL');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('terminates a process when a signal is sent and logs the outcome', () => {
    const fixture = TestBed.createComponent(SignalsVisualizerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const sendBtn = compiled.querySelector('tbody tr .sc-send') as HTMLButtonElement;
    sendBtn.click();
    fixture.detectChanges();

    expect(compiled.querySelector('tbody tr .sc-status-badge')?.textContent).toContain('terminated');
    expect(compiled.querySelector('.sc-signal-log')?.textContent).toContain('SIGTERM');
  });
});
