import { Lab } from '../execution/types';

export const LAB_02_PERMISSIONS: Lab = {
  id: 'lab-02',
  title: 'Permissions',
  level: 'beginner',
  durationMinutes: 12,
  xp: 150,
  summary: 'Read and change the owner/group/others permission model with chmod.',
  commandGuide: [
    {
      command: 'ls -l',
      pattern: 'ls -l <file>',
      summary: 'Inspect permissions and metadata for a file.',
      detail: [
        'ls -l prints a long listing. The first column is the permission string (e.g. -rw-r--r--); the next columns are link count, owner, group, size, date, and name.',
        'The leading character tells you the type: - for a regular file, d for a directory. The next nine characters are owner, group, and others permissions (r read, w write, x execute).',
      ],
    },
    {
      command: 'chmod',
      pattern: 'chmod <mode> <file>',
      summary: 'Change who can read, write, or execute a file.',
      detail: [
        'chmod changes permission bits. Numeric mode uses three digits: owner, group, others. Each digit is the sum of r=4, w=2, x=1.',
        'Example: chmod 755 deploy.sh gives the owner rwx (7), and group and others r-x (5).',
        'You can also use symbolic forms like chmod u+x file, but this lab focuses on numeric modes.',
      ],
    },
  ],
  initialState: {
    cwd: '/home/guest/lab-02',
    files: [
      { path: '/home/guest/lab-02/deploy.sh', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
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
