import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CompletePage } from './complete.page';

describe('CompletePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompletePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the completion reward summary', () => {
    const fixture = TestBed.createComponent(CompletePage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Permissions Master');
    expect(compiled.textContent).toContain('Permission Core');
  });
});
