import { Lab } from '../execution/types';

export const LAB_01_FILESYSTEM: Lab = {
  id: 'lab-01',
  title: 'Filesystem Quest',
  level: 'beginner',
  durationMinutes: 12,
  xp: 120,
  summary: 'Find the hidden mission file by navigating a tiny Linux workspace.',
  initialState: {
    cwd: '/home/guest/lab-01',
    files: [
      { path: '/home/guest/lab-01/labs', type: 'dir', permissions: 'rwxr-xr-x', owner: 'guest' },
      { path: '/home/guest/lab-01/labs/mission.txt', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
    ],
  },
  steps: [
    {
      id: 'step-01-orient',
      prompt: 'Check where this terminal session starts.',
      acceptedCommands: ['pwd'],
      expectedOutput: ['/home/guest/lab-01'],
      explanation: 'pwd prints the current working directory so you know where the hunt begins.',
      hint: 'Use the three-letter command for print working directory.',
      visual: {
        focus: 'filesystem',
        labels: ['current path', 'workspace'],
        targetPath: '/home/guest/lab-01',
      },
    },
    {
      id: 'step-02-scan-projects',
      prompt: 'List this directory and spot the labs folder.',
      acceptedCommands: ['ls', 'ls -l', 'ls -la', 'ls -al', 'ls labs', 'ls labs/', 'ls ./labs'],
      expectedOutput: [
        'drwxr-xr-x 3 guest guest 4096 .',
        'drwxr-xr-x 3 guest guest 4096 ..',
        'drwxr-xr-x 2 guest guest 4096 labs',
      ],
      explanation: 'ls -la reveals the directory contents with ownership and permissions.',
      hint: 'Combine the list command with the -l and -a flags.',
      visual: {
        focus: 'filesystem',
        labels: ['list', 'labs'],
        targetPath: '/home/guest/lab-01/labs',
      },
    },
    {
      id: 'step-03-enter-labs',
      prompt: 'Move into the labs directory.',
      acceptedCommands: ['cd labs', 'cd labs/', 'cd ./labs', 'cd ./labs/'],
      expectedOutput: [],
      explanation: 'cd changes the working directory. The prompt and map now follow you into labs.',
      hint: 'Use cd followed by the directory name.',
      visual: {
        focus: 'filesystem',
        labels: ['change directory', 'labs'],
        targetPath: '/home/guest/lab-01/labs',
      },
    },
    {
      id: 'step-04-find-mission',
      prompt: 'List the lab directory and find the mission file.',
      acceptedCommands: [
        'ls',
        'ls -l',
        'ls -la',
        'ls -al',
        'ls mission.txt',
        'ls ./mission.txt',
        'ls labs',
        'ls labs/',
      ],
      expectedOutput: [
        'drwxr-xr-x 2 guest guest 4096 .',
        'drwxr-xr-x 3 guest guest 4096 ..',
        '-rw-r--r-- 1 guest guest  160 mission.txt',
      ],
      explanation: 'The directory now contains mission.txt, the file you need to read.',
      hint: 'Use the same long listing command again.',
      visual: {
        focus: 'filesystem',
        labels: ['mission.txt', 'target file'],
        targetPath: '/home/guest/lab-01/labs/mission.txt',
      },
    },
    {
      id: 'step-05-read-mission',
      prompt: 'Read mission.txt to complete the filesystem quest.',
      acceptedCommands: ['cat mission.txt', 'cat ./mission.txt'],
      expectedOutput: [
        'MISSION_READY=filesystem',
        'You found the mission file. Next stop: permissions.',
      ],
      explanation: 'cat prints a file to the terminal. You used it to reveal the mission message.',
      hint: 'Use cat followed by the file name.',
      visual: {
        focus: 'filesystem',
        labels: ['cat', 'mission complete'],
        targetPath: '/home/guest/lab-01/labs/mission.txt',
      },
    },
  ],
};
