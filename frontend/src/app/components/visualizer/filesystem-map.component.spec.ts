import { TestBed } from '@angular/core/testing';
import { entriesIn, FilesystemMapComponent, pathSegments } from './filesystem-map.component';
import { LabFile, LabState } from '../../core/execution/types';

const files: LabFile[] = [
  { path: '/home/guest/projects/README.md', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
  { path: '/home/guest/projects/labs', type: 'dir', permissions: 'rwxr-xr-x', owner: 'guest' },
  { path: '/home/guest/projects/labs/lab1.txt', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
];

describe('filesystem-map helpers', () => {
  it('splits a path into segments', () => {
    expect(pathSegments('/home/guest/projects')).toEqual(['home', 'guest', 'projects']);
    expect(pathSegments('/')).toEqual([]);
  });

  it('lists only the direct children of the cwd', () => {
    const entries = entriesIn('/home/guest/projects', files);
    expect(entries.map((e) => e.name)).toEqual(['README.md', 'labs']);
    expect(entries.find((e) => e.name === 'labs')?.type).toBe('dir');
  });
});

describe('FilesystemMapComponent', () => {
  it('renders the cwd breadcrumb and its entries', () => {
    const state: LabState = { cwd: '/home/guest/projects', files };
    const fixture = TestBed.createComponent(FilesystemMapComponent);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('projects');
    expect(text).toContain('README.md');
    expect(text).toContain('labs');
    expect(fixture.nativeElement.querySelector('.sc-fs-seg.is-current')?.textContent).toContain(
      'projects',
    );
  });
});
