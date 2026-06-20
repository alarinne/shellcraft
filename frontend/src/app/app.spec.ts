import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the persistent shell brand and navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ShellCraft');
    expect(compiled.textContent).toContain('Learning Path');
    expect(compiled.textContent).toContain('Lab Screen');
  });

  it('should route between landing, path, lab, and completed screens', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.textContent).toContain('Learn Linux');

    await harness.navigateByUrl('/path');
    expect(harness.routeNativeElement?.textContent).toContain('Pro Developer Track');

    await harness.navigateByUrl('/lab/lab-02');
    expect(harness.routeNativeElement?.textContent).toContain('Run chmod 755 deploy.sh');

    await harness.navigateByUrl('/complete');
    expect(harness.routeNativeElement?.textContent).toContain('Permissions Master');
  });
});
