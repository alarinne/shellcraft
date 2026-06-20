import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LabPage } from './lab.page';

describe('LabPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows the current permissions task', () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Run chmod 755 deploy.sh');
  });

  it('updates the terminal and visual map when a command is selected', async () => {
    const fixture = TestBed.createComponent(LabPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('mode changed: deploy.sh -> rwxr-xr-x');

    clickButton(compiled, 'chmod 755 deploy.sh');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain('mode changed: deploy.sh -> rwxr-xr-x');
    expect(compiled.textContent).toContain('owner rwx');
  });
});

function clickButton(compiled: HTMLElement, text: string): void {
  const button = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  button?.click();
}
