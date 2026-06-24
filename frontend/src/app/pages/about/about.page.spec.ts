import { TestBed } from '@angular/core/testing';
import { AboutPage } from './about.page';

describe('AboutPage', () => {
  it('renders the ShellCraft safety overview', async () => {
    await TestBed.configureTestingModule({
      imports: [AboutPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(AboutPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Safe Linux practice');
    expect(fixture.nativeElement.textContent).toContain('Docker sandbox');
  });
});

