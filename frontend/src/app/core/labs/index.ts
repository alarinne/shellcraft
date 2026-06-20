import { Lab } from '../execution/types';
import { LAB_01_FILESYSTEM } from './lab-01-filesystem';
import { LAB_02_PERMISSIONS } from './lab-02-permissions';

/** All labs available in the MVP, in learning-path order. */
export const LABS: readonly Lab[] = [LAB_01_FILESYSTEM, LAB_02_PERMISSIONS];

export const LABS_BY_ID: ReadonlyMap<string, Lab> = new Map(LABS.map((lab) => [lab.id, lab]));

export function getLab(id: string | undefined): Lab | undefined {
  return id ? LABS_BY_ID.get(id) : undefined;
}
