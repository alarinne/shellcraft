import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingPage } from './landing.page';

describe('LandingPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the hero, terminal preview, and feature highlights', () => {
    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Learn Linux');
    expect(compiled.textContent).toContain('Interactive Terminal');
    expect(compiled.textContent).toContain('Start Lab 01');
  });
});
