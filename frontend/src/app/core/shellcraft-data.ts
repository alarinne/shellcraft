/**
 * Shared presentational data and types for the ShellCraft MVP screens.
 *
 * This is a transitional home for the mock data that previously lived inline in
 * the monolithic `App` component. Issue #3 replaces these arrays with
 * JSON-driven labs behind a pluggable `ExecutionBackend`; until then the routed
 * page components consume these constants.
 */

export interface LabCard {
  id: string;
  title: string;
  tag: string;
  status: string;
  description: string;
  xp: number;
  accent: 'blue' | 'purple' | 'orange';
  locked: boolean;
  actionLabel: string;
  commands: string[];
}

export interface CommandDemo {
  command: string;
  label: string;
  output: string[];
  insight: string;
  visualSteps: string[];
}

export interface StatItem {
  label: string;
  value: string;
}

export interface PermissionRow {
  role: string;
  value: string;
  tone: 'blue' | 'purple' | 'orange';
}

export const STATS: readonly StatItem[] = [
  { label: 'Completed', value: '0' },
  { label: 'XP earned', value: '0' },
  { label: 'Streak', value: '0' },
];

export const LABS: readonly LabCard[] = [
  {
    id: 'lab-01',
    title: 'Filesystem Quest',
    tag: 'Lab 01',
    status: 'Current',
    description: 'Find mission.txt by moving through a tiny Linux workspace.',
    xp: 120,
    accent: 'blue',
    locked: false,
    actionLabel: 'Start lab',
    commands: ['pwd', 'ls', 'cd labs', 'cat mission.txt'],
  },
  {
    id: 'lab-02',
    title: 'Permissions',
    tag: 'Lab 02',
    status: 'Next',
    description: 'Learn chmod, ownership, and the rwx permission model.',
    xp: 150,
    accent: 'purple',
    locked: false,
    actionLabel: 'Start lab',
    commands: ['ls -l deploy.sh', 'chmod 755 deploy.sh'],
  },
  {
    id: 'lab-03',
    title: 'Pipes & Grep',
    tag: 'Lab 03',
    status: 'Available',
    description: 'Filter logs and connect commands through streams.',
    xp: 180,
    accent: 'orange',
    locked: false,
    actionLabel: 'Start lab',
    commands: ['cat access.log', 'grep ERROR access.log', 'wc -l'],
  },
  {
    id: 'lab-04',
    title: 'Process Watch',
    tag: 'Lab 04',
    status: 'Available',
    description: 'Start a background worker, find it with ps, and stop it.',
    xp: 200,
    accent: 'blue',
    locked: false,
    actionLabel: 'Start lab',
    commands: ['./worker.sh &', 'ps aux', 'pkill -f worker.sh'],
  },
  {
    id: 'lab-05',
    title: 'Signals',
    tag: 'Lab 05',
    status: 'Available',
    description: 'Launch a script and stop it gracefully with SIGTERM.',
    xp: 220,
    accent: 'purple',
    locked: false,
    actionLabel: 'Start lab',
    commands: ['./hang.sh &', 'kill -15', 'ps aux'],
  },
];

export const COMMAND_DEMOS: readonly CommandDemo[] = [
  {
    command: 'pwd',
    label: 'Locate current path',
    output: ['/home/guest/lab-01'],
    insight: 'pwd prints the working directory before you move through the filesystem.',
    visualSteps: ['home', 'guest', 'projects'],
  },
  {
    command: 'ls -la',
    label: 'Inspect directory',
    output: [
      'drwxr-xr-x 2 guest guest 4096 labs',
    ],
    insight: 'Long listing shows permissions, owner, group, size, and file names.',
    visualSteps: ['type', 'permissions', 'owner', 'name'],
  },
  {
    command: 'cat mission.txt',
    label: 'Reveal mission',
    output: ['MISSION_READY=filesystem'],
    insight: 'cat prints the mission file after you navigate into the labs directory.',
    visualSteps: ['labs', 'mission.txt', 'message'],
  },
];

export const PERMISSION_ROWS: readonly PermissionRow[] = [
  { role: 'Owner', value: 'rwx', tone: 'blue' },
  { role: 'Group', value: 'r-x', tone: 'purple' },
  { role: 'Others', value: 'r-x', tone: 'orange' },
];

export const LEARNED_COMMANDS: readonly string[] = ['pwd', 'ls -la', 'cd', 'cat'];

/** Default lab id used when navigating to the lab screen without a selection. */
export const DEFAULT_LAB_ID = 'lab-01';
export const NEXT_LAB_ID = 'lab-02';

export function findLab(id: string | undefined): LabCard {
  return LABS.find((lab) => lab.id === id) ?? LABS[0];
}
