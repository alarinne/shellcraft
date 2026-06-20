import { TestBed } from '@angular/core/testing';
import { PipesVisualizerComponent } from './pipes-visualizer.component';

describe('PipesVisualizerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PipesVisualizerComponent] }).compileComponents();
  });

  it('renders the pipeline command and a count for the default pattern', () => {
    const fixture = TestBed.createComponent(PipesVisualizerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('cat access.log | grep ERROR | wc -l');
    // 3 ERROR lines in the sample log.
    expect(compiled.querySelector('.sc-pipe-number')?.textContent?.trim()).toBe('3');
  });

  it('recomputes the count when the grep pattern changes', () => {
    const fixture = TestBed.createComponent(PipesVisualizerComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const cmp = fixture.componentInstance as unknown as { setPattern(v: string): void };
    cmp.setPattern('WARN');
    fixture.detectChanges();

    expect(compiled.querySelector('.sc-pipe-number')?.textContent?.trim()).toBe('1');
  });
});
