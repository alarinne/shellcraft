import { Lab } from '../execution/types';
import { LAB_01_FILESYSTEM } from './lab-01-filesystem';
import { LAB_02_PERMISSIONS } from './lab-02-permissions';
import { LAB_03_PIPES } from './lab-03-pipes';
import { LAB_04_PROCESSES } from './lab-04-processes';
import { LAB_05_SIGNALS } from './lab-05-signals';

/** All labs available in the MVP, in learning-path order. */
export const LABS: readonly Lab[] = [
  LAB_01_FILESYSTEM,
  LAB_02_PERMISSIONS,
  LAB_03_PIPES,
  LAB_04_PROCESSES,
  LAB_05_SIGNALS,
];

export const LABS_BY_ID: ReadonlyMap<string, Lab> = new Map(LABS.map((lab) => [lab.id, lab]));

export function getLab(id: string | undefined): Lab | undefined {
  return id ? LABS_BY_ID.get(id) : undefined;
}

/** Lab ids that run in the hardened Docker sandbox when available. */
export const DOCKER_LAB_IDS: ReadonlySet<string> = new Set(
  LABS.map((lab) => lab.id),
);
