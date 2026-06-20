import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the pro-developer landing page', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Learn Linux');
    expect(compiled.textContent).toContain('Start Lab 01');
    expect(compiled.textContent).toContain('Interactive Terminal');
  });

  it('should navigate through learning path, lab, and completed screens', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    clickButton(compiled, 'Learning Path');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.textContent).toContain('Pro Developer Track');

    clickButton(compiled, 'Start lab');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.textContent).toContain('Run chmod 755 deploy.sh');

    clickButton(compiled, 'Complete lab');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.textContent).toContain('Permissions Master');
  });

  it('should update the terminal observation when a command is selected', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    clickButton(compiled, 'Lab Screen');
    fixture.detectChanges();
    await fixture.whenStable();

    clickButton(compiled, 'chmod 755 deploy.sh');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.textContent).toContain('mode changed: deploy.sh -> rwxr-xr-x');
    expect(compiled.textContent).toContain('owner rwx');
  });
});

function clickButton(compiled: HTMLElement, text: string): void {
  const button = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button'))
    .find((candidate) => candidate.textContent?.includes(text));

  expect(button).toBeTruthy();
  button?.click();
}
