import { Lab } from '../execution/types';

export const LAB_02_PERMISSIONS: Lab = {
  id: 'lab-02',
  title: 'Permissions',
  level: 'beginner',
  durationMinutes: 12,
  xp: 150,
  summary: 'Read and change the owner/group/others permission model with chmod.',
  initialState: {
    cwd: '/home/guest/projects',
    files: [
      { path: '/home/guest/projects/deploy.sh', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
    ],
  },
  steps: [
    {
      id: 'step-01-inspect',
      prompt: 'Inspect the current permissions of deploy.sh.',
      acceptedCommands: [
        'ls -l',
        'ls -la',
        'ls -l deploy.sh',
        'ls -la deploy.sh',
        'ls -l ./deploy.sh',
        'stat deploy.sh',
        'stat ./deploy.sh',
      ],
      expectedOutput: ['-rw-r--r-- 1 guest guest 913 deploy.sh'],
      explanation: 'The first column is the permission triplet for owner, group, and others.',
      hint: 'Use ls -l (or stat) to read the mode.',
      visual: { focus: 'permissions', labels: ['owner rw-', 'group r--', 'others r--'] },
    },
    {
      id: 'step-02-chmod',
      prompt: 'Run chmod 755 deploy.sh',
      acceptedCommands: ['chmod 755 deploy.sh', 'chmod 755 ./deploy.sh'],
      expectedOutput: ['mode changed: deploy.sh -> rwxr-xr-x'],
      explanation: 'Owner keeps write access while group and others can read and execute.',
      hint: '7 = rwx for the owner, 5 = r-x for group and others.',
      visual: { focus: 'permissions', labels: ['owner rwx', 'group r-x', 'others r-x'] },
    },
  ],
};
