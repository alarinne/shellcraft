import { Lab } from '../execution/types';

export const LAB_03_PIPES: Lab = {
  id: 'lab-03',
  title: 'Pipes & Grep',
  level: 'beginner',
  durationMinutes: 15,
  xp: 180,
  summary: 'Filter logs and connect commands through streams with grep and pipes.',
  initialState: {
    cwd: '/home/guest/projects/logs',
    files: [
      { path: '/home/guest/projects/logs/access.log', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
    ],
  },
  steps: [
    {
      id: 'step-01-view-log',
      prompt: 'Open the access log and skim the lines.',
      acceptedCommands: ['cat access.log', 'cat ./access.log', 'head access.log', 'head -n 5 access.log'],
      expectedOutput: [
        '2026-06-01 INFO user login ok',
        '2026-06-01 ERROR disk full on /var',
        '2026-06-01 INFO backup finished',
        '2026-06-02 ERROR connection timeout',
        '2026-06-02 INFO shutdown complete',
      ],
      explanation: 'cat and head print file contents so you can see what you will filter.',
      hint: 'Use cat or head on access.log.',
      visual: { focus: 'filesystem', labels: ['access.log', 'log lines'], targetPath: '/home/guest/projects/logs/access.log' },
    },
    {
      id: 'step-02-grep-errors',
      prompt: 'Filter the log for ERROR lines.',
      acceptedCommands: [
        'grep ERROR access.log',
        'grep -i error access.log',
        'grep ERROR ./access.log',
        "grep 'ERROR' access.log",
      ],
      expectedOutput: [
        '2026-06-01 ERROR disk full on /var',
        '2026-06-02 ERROR connection timeout',
      ],
      explanation: 'grep scans each line and prints matches — perfect for finding errors in a log.',
      hint: 'Use grep with the word ERROR and the log file name.',
      visual: { focus: 'filesystem', labels: ['grep', 'ERROR'], targetPath: '/home/guest/projects/logs/access.log' },
    },
    {
      id: 'step-03-count-errors',
      prompt: 'Count how many ERROR lines appear in the log.',
      acceptedCommands: [
        'grep ERROR access.log | wc -l',
        'grep -c ERROR access.log',
        'grep -i error access.log | wc -l',
      ],
      expectedOutput: ['2'],
      explanation: 'Piping grep into wc -l counts matching lines; grep -c does it in one command.',
      hint: 'Pipe grep output into wc -l, or use grep -c.',
      visual: { focus: 'filesystem', labels: ['pipe', 'wc -l'], targetPath: '/home/guest/projects/logs/access.log' },
    },
  ],
};
