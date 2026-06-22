import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LAB_01_FILESYSTEM } from '../../core/labs/lab-01-filesystem';
import { LabProgress } from '../../core/progress/lab-progress';
import { PathPage } from './path.page';

describe('PathPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the learning path with lab cards', () => {
    const fixture = TestBed.createComponent(PathPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Pro Developer Track');
    expect(compiled.textContent).toContain('Filesystem Quest');
    expect(compiled.textContent).toContain('Permissions');
    expect(compiled.textContent).toContain('0');
    expect(compiled.textContent).toContain('XP earned');
    expect(compiled.querySelectorAll('.sc-lab-card').length).toBe(3);
  });

  it('updates stats and lab status after Lab 01 is claimed', () => {
    TestBed.inject(LabProgress).complete(LAB_01_FILESYSTEM);

    const fixture = TestBed.createComponent(PathPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('1');
    expect(compiled.textContent).toContain('120');
    expect(compiled.textContent).toContain('Completed');
    expect(compiled.textContent).toContain('Review');
    expect(compiled.textContent).toContain('Permissions');
    expect(compiled.textContent).toContain('Current');
  });
});
