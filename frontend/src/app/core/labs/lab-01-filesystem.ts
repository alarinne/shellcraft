import { Lab } from '../execution/types';

export const LAB_01_FILESYSTEM: Lab = {
  id: 'lab-01',
  title: 'Terminal & Filesystem',
  level: 'beginner',
  durationMinutes: 10,
  xp: 120,
  summary: 'Learn where you are, list files, and move between directories.',
  initialState: {
    cwd: '/home/guest/projects',
    files: [
      { path: '/home/guest/projects/README.md', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
      { path: '/home/guest/projects/deploy.sh', type: 'file', permissions: 'rwxr-xr-x', owner: 'guest' },
      { path: '/home/guest/projects/labs', type: 'dir', permissions: 'rwxr-xr-x', owner: 'guest' },
    ],
  },
  steps: [
    {
      id: 'step-01-pwd',
      prompt: 'Find out which directory you are currently in.',
      acceptedCommands: ['pwd'],
      expectedOutput: ['/home/guest/projects'],
      explanation: 'pwd prints the current working directory.',
      hint: 'The command is three letters: print working directory.',
      visual: { focus: 'cwd', labels: ['home', 'guest', 'projects'] },
    },
    {
      id: 'step-02-ls',
      prompt: 'List the files here, including hidden ones and permissions.',
      acceptedCommands: ['ls -la', 'ls -al'],
      expectedOutput: [
        'drwxr-xr-x 2 guest guest 4096 labs',
        '-rw-r--r-- 1 guest guest  248 README.md',
        '-rwxr-xr-x 1 guest guest  913 deploy.sh',
      ],
      explanation: 'The -la flags show hidden files and the long permission listing.',
      hint: 'Combine the list command with the -l and -a flags.',
      visual: { focus: 'listing', labels: ['type', 'permissions', 'owner', 'name'] },
    },
    {
      id: 'step-03-cd',
      prompt: 'Move into the labs directory.',
      acceptedCommands: ['cd labs', 'cd ./labs'],
      expectedOutput: ['/home/guest/projects/labs'],
      explanation: 'cd changes the working directory; the filesystem map follows along.',
      hint: 'Use cd followed by the directory name.',
      visual: { focus: 'cwd', labels: ['projects', 'labs'] },
    },
  ],
};
