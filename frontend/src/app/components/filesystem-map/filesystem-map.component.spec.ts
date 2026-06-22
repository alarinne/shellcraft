import { TestBed } from '@angular/core/testing';
import { LabState } from '../../core/execution/types';
import { FilesystemMapComponent } from './filesystem-map.component';

const state: LabState = {
  cwd: '/home/guest/projects',
  files: [
    { path: '/home/guest/projects/README.md', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
    { path: '/home/guest/projects/labs', type: 'dir', permissions: 'rwxr-xr-x', owner: 'guest' },
    { path: '/home/guest/projects/labs/mission.txt', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
  ],
};

describe('FilesystemMapComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesystemMapComponent],
    }).compileComponents();
  });

  it('renders the current path and visible entries', () => {
    const fixture = TestBed.createComponent(FilesystemMapComponent);
    fixture.componentRef.setInput('state', state);
    fixture.componentRef.setInput('targetPath', '/home/guest/projects/labs');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('projects');
    expect(compiled.textContent).toContain('README.md');
    expect(compiled.textContent).toContain('labs');
    expect(compiled.textContent).not.toContain('mission.txt');
    expect(compiled.querySelector('.sc-fs-entry.is-target')?.textContent).toContain('labs');
  });

  it('updates entries when cwd changes', () => {
    const fixture = TestBed.createComponent(FilesystemMapComponent);
    fixture.componentRef.setInput('state', { ...state, cwd: '/home/guest/projects/labs' });
    fixture.componentRef.setInput('targetPath', '/home/guest/projects/labs/mission.txt');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('mission.txt');
    expect(compiled.textContent).not.toContain('README.md');
    expect(compiled.querySelector('.sc-fs-entry.is-target')?.textContent).toContain('mission.txt');
  });
});
