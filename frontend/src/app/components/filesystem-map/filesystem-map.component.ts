import { Component, computed, input } from '@angular/core';
import { LabFile, LabState } from '../../core/execution/types';

interface Breadcrumb {
  label: string;
  path: string;
  current: boolean;
}

interface DirectoryEntry {
  file: LabFile;
  name: string;
  target: boolean;
}

@Component({
  selector: 'sc-filesystem-map',
  templateUrl: './filesystem-map.component.html',
  styleUrl: './filesystem-map.component.scss',
})
export class FilesystemMapComponent {
  readonly state = input<LabState | null>(null);
  readonly targetPath = input<string | undefined>();

  protected readonly cwd = computed(() => this.state()?.cwd ?? '/');
  protected readonly breadcrumbs = computed(() => breadcrumbsFor(this.cwd()));
  protected readonly entries = computed(() => {
    const state = this.state();
    if (!state) {
      return [];
    }

    const targetPath = normalizePath(this.targetPath());
    return state.files
      .filter((file) => parentPath(file.path) === normalizePath(state.cwd))
      .map<DirectoryEntry>((file) => ({
        file,
        name: fileName(file.path),
        target: normalizePath(file.path) === targetPath,
      }))
      .sort((a, b) => {
        if (a.file.type !== b.file.type) {
          return a.file.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  });
}

function breadcrumbsFor(path: string): Breadcrumb[] {
  const parts = normalizePath(path).split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [{ label: '/', path: '/', current: parts.length === 0 }];
  let currentPath = '';

  for (const part of parts) {
    currentPath += `/${part}`;
    crumbs.push({
      label: part,
      path: currentPath,
      current: currentPath === normalizePath(path),
    });
  }

  return crumbs;
}

function parentPath(path: string): string {
  const parts = normalizePath(path).split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}` : '/';
}

function fileName(path: string): string {
  return normalizePath(path).split('/').filter(Boolean).pop() ?? '/';
}

function normalizePath(path: string | undefined): string {
  if (!path) {
    return '/';
  }

  const normalized = path.replace(/\/+/g, '/');
  return normalized.length > 1 ? normalized.replace(/\/$/, '') : normalized;
}
