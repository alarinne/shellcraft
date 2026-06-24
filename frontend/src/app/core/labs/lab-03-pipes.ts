import { Lab } from '../execution/types';

export const LAB_03_PIPES: Lab = {
  id: 'lab-03',
  title: 'Pipes & Grep',
  level: 'beginner',
  durationMinutes: 15,
  xp: 180,
  summary: 'Filter logs and connect commands through streams with grep and pipes.',
  commandGuide: [
    {
      command: 'cat',
      pattern: 'cat <filename>',
      summary: 'Display a log or text file in the terminal.',
      detail: [
        'cat prints the entire file to stdout. Replace <filename> with the path to your log, e.g. cat access.log.',
        'Useful to skim contents before filtering. For very large files, head -n 20 <filename> shows just the first 20 lines.',
      ],
    },
    {
      command: 'grep',
      pattern: 'grep <pattern> <file>',
      summary: 'Show only lines that match a search pattern.',
      detail: [
        'grep scans each line and prints matches. Replace <pattern> with text to find (ERROR) and <file> with the file to search.',
        'Useful flags:',
        '• -i — case-insensitive search',
        '• -c — count matching lines instead of printing them',
        'Patterns are literal text unless you use regular-expression options.',
      ],
    },
    {
      command: 'wc -l',
      pattern: 'wc -l',
      summary: 'Count how many lines were received.',
      detail: [
        'wc counts words, lines, and bytes. -l limits the output to line count only.',
        'Often used after a pipe: grep ERROR access.log | wc -l counts ERROR lines in the log.',
      ],
    },
    {
      command: '|',
      pattern: 'cmd1 | cmd2',
      summary: 'Send the output of one command into the next.',
      detail: [
        'The pipe operator | connects stdout of cmd1 to stdin of cmd2, so you chain small tools into one workflow.',
        'Example: cat access.log | grep ERROR runs grep on cat’s output without creating a temporary file.',
        'Read pipes left to right: the left command produces data; the right command consumes it.',
      ],
    },
  ],
  initialState: {
    cwd: '/home/guest/lab-03/logs',
    files: [
      { path: '/home/guest/lab-03/logs/access.log', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
    ],
  },
  steps: [
    {
      id: 'step-01-view-log',
      prompt: 'Open the access log and skim the lines.',
      acceptedCommands: [
        'ls',
        'ls -l',
        'ls -la',
        'ls -al',
        'ls access.log',
        'ls ./access.log',
        'cat access.log',
        'cat ./access.log',
        'head access.log',
        'head -n 5 access.log',
      ],
      expectedOutput: [
        '2026-06-01 INFO user login ok',
        '2026-06-01 ERROR disk full on /var',
        '2026-06-01 INFO backup finished',
        '2026-06-02 ERROR connection timeout',
        '2026-06-02 INFO shutdown complete',
      ],
      explanation: 'cat and head print file contents so you can see what you will filter.',
      hint: 'Use cat or head on access.log.',
      visual: { focus: 'filesystem', labels: ['access.log', 'log lines'], targetPath: '/home/guest/lab-03/logs/access.log' },
    },
    {
      id: 'step-02-grep-errors',
      prompt: 'Filter the log for ERROR lines.',
      acceptedCommands: [
        'grep ERROR access.log',
        'grep -i error access.log',
        'grep ERROR ./access.log',
        "grep 'ERROR' access.log",
        'cat access.log | grep ERROR',
        'cat access.log | grep -i error',
        'cat ./access.log | grep ERROR',
      ],
      expectedOutput: [
        '2026-06-01 ERROR disk full on /var',
        '2026-06-02 ERROR connection timeout',
      ],
      explanation: 'grep scans each line and prints matches — perfect for finding errors in a log.',
      hint: 'Use grep on access.log, or pipe cat into grep.',
      visual: { focus: 'filesystem', labels: ['grep', 'ERROR'], targetPath: '/home/guest/lab-03/logs/access.log' },
    },
    {
      id: 'step-03-count-errors',
      prompt: 'Count how many ERROR lines appear in the log.',
      acceptedCommands: [
        'grep ERROR access.log | wc -l',
        'grep -c ERROR access.log',
        'grep -i error access.log | wc -l',
        'cat access.log | grep ERROR | wc -l',
        'cat access.log | grep -i error | wc -l',
      ],
      expectedOutput: ['2'],
      explanation: 'Piping grep into wc -l counts matching lines; grep -c does it in one command.',
      hint: 'Pipe grep into wc -l, use grep -c, or cat access.log | grep ERROR | wc -l.',
      visual: { focus: 'filesystem', labels: ['pipe', 'wc -l'], targetPath: '/home/guest/lab-03/logs/access.log' },
    },
  ],
};
