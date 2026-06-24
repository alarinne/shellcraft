import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../../core/auth/auth-storage';
import { AuthService } from '../../core/auth/auth.service';
import { LAB_01_FILESYSTEM } from '../../core/labs/lab-01-filesystem';
import { LabProgress } from '../../core/progress/lab-progress';
import { PathPage } from './path.page';

describe('PathPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathPage],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
      ],
    }).compileComponents();
  });

  it('renders the guest roadmap overview with lab cards', () => {
    const fixture = TestBed.createComponent(PathPage);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Master the Linux Path');
    expect(compiled.textContent).toContain('Filesystem Quest');
    expect(compiled.textContent).toContain('Permissions');
    expect(compiled.textContent).toContain('Pipes & Grep');
    expect(compiled.textContent).toContain('Requires Lab 01 progress');
    expect(compiled.textContent).toContain('Terminal Scout - Tier 1');
    expect(compiled.querySelectorAll('.sc-roadmap-card').length).toBe(5);
  });

  it('updates stats and lab status after Lab 01 is claimed', () => {
    TestBed.inject(AuthService).register('Ada Lovelace', 'ada@shellcraft.dev', 'secret1');
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
