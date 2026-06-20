import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LabFile, LabState } from '../../core/execution/types';

export interface MapEntry {
  name: string;
  type: 'file' | 'dir';
  permissions: string;
}

/** Split an absolute path into its non-empty segments. */
export function pathSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/** Direct children of `cwd` within the simulated file list. */
export function entriesIn(cwd: string, files: LabFile[]): MapEntry[] {
  const prefix = cwd.endsWith('/') ? cwd : cwd + '/';
  return files
    .filter((f) => f.path.startsWith(prefix))
    .map((f) => {
      const rest = f.path.slice(prefix.length);
      const name = rest.split('/')[0];
      const isDirect = !rest.includes('/');
      return { name, type: isDirect ? f.type : ('dir' as const), permissions: f.permissions };
    })
    .filter((entry, i, arr) => arr.findIndex((e) => e.name === entry.name) === i);
}

/**
 * Interactive filesystem (FHS) map: a breadcrumb of the current working
 * directory plus the entries inside it, reacting to `cd`/`ls` as the learner
 * navigates the simulated state.
 */
@Component({
  selector: 'sc-filesystem-map',
  templateUrl: './filesystem-map.component.html',
  styleUrl: './filesystem-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesystemMapComponent {
  readonly state = input.required<LabState>();

  protected readonly segments = computed(() => pathSegments(this.state().cwd));
  protected readonly entries = computed(() => entriesIn(this.state().cwd, this.state().files));
}
