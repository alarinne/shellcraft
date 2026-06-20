import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface PermissionBit {
  label: 'r' | 'w' | 'x';
  on: boolean;
}

export interface PermissionRole {
  role: 'Owner' | 'Group' | 'Others';
  tone: 'blue' | 'purple' | 'orange';
  bits: PermissionBit[];
}

const ROLES: ReadonlyArray<PermissionRole['role']> = ['Owner', 'Group', 'Others'];
const TONES: ReadonlyArray<PermissionRole['tone']> = ['blue', 'purple', 'orange'];

/** Parse a symbolic mode like "rwxr-xr-x" into owner/group/others bit rows. */
export function parsePermissions(permissions: string): PermissionRole[] {
  const clean = (permissions ?? '').slice(-9).padStart(9, '-');
  return ROLES.map((role, i) => {
    const triplet = clean.slice(i * 3, i * 3 + 3);
    const bits: PermissionBit[] = (['r', 'w', 'x'] as const).map((label, j) => ({
      label,
      on: triplet[j] === label,
    }));
    return { role, tone: TONES[i], bits };
  });
}

/**
 * Visualizes a file's `rwx` permission model for owner/group/others, reacting to
 * the live simulated state (e.g. after a `chmod`).
 */
@Component({
  selector: 'sc-permission-grid',
  templateUrl: './permission-grid.component.html',
  styleUrl: './permission-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionGridComponent {
  readonly file = input('');
  readonly permissions = input.required<string>();

  protected readonly roles = computed(() => parsePermissions(this.permissions()));
}
