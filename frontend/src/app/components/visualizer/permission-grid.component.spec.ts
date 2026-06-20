import { TestBed } from '@angular/core/testing';
import { parsePermissions, PermissionGridComponent } from './permission-grid.component';

describe('parsePermissions', () => {
  it('splits a symbolic mode into owner/group/others bits', () => {
    const roles = parsePermissions('rwxr-xr-x');
    expect(roles.map((r) => r.role)).toEqual(['Owner', 'Group', 'Others']);
    expect(roles[0].bits.map((b) => b.on)).toEqual([true, true, true]); // rwx
    expect(roles[1].bits.map((b) => b.on)).toEqual([true, false, true]); // r-x
    expect(roles[2].bits.map((b) => b.on)).toEqual([true, false, true]); // r-x
  });

  it('handles read-only modes', () => {
    const roles = parsePermissions('rw-r--r--');
    expect(roles[0].bits.map((b) => b.on)).toEqual([true, true, false]); // rw-
    expect(roles[2].bits.map((b) => b.on)).toEqual([true, false, false]); // r--
  });
});

describe('PermissionGridComponent', () => {
  it('renders nine permission cells with the enabled ones marked', () => {
    const fixture = TestBed.createComponent(PermissionGridComponent);
    fixture.componentRef.setInput('file', 'deploy.sh');
    fixture.componentRef.setInput('permissions', 'rwxr-xr-x');
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.sc-perm-bit');
    expect(cells.length).toBe(9);
    expect(fixture.nativeElement.querySelectorAll('.sc-perm-bit.on').length).toBe(7);
    expect(fixture.nativeElement.textContent).toContain('deploy.sh');
  });
});
