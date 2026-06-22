import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
    expect(compiled.textContent).toContain('Terminal & Filesystem');
    expect(compiled.textContent).toContain('Permissions');
    expect(compiled.querySelectorAll('.sc-lab-card').length).toBe(3);
  });
});
