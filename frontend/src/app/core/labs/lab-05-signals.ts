import { Lab } from '../execution/types';

export const LAB_05_SIGNALS: Lab = {
  id: 'lab-05',
  title: 'Signals',
  level: 'intermediate',
  durationMinutes: 15,
  xp: 220,
  summary: 'Launch a long-running script and stop it with SIGTERM.',
  commandGuide: [
    {
      command: '&',
      pattern: '<script> &',
      summary: 'Start a long-running script in the background.',
      detail: [
        'Background jobs let you keep using the shell while a script runs. Example: ./hang.sh &',
        'The shell prints a job number and PID. You need the PID (or name) to send signals with kill.',
      ],
    },
    {
      command: 'kill',
      pattern: 'kill -<signal> <pid>',
      summary: 'Send a signal to a process.',
      detail: [
        'kill does not only “force quit” — it delivers a signal. Replace <pid> with the process id from ps.',
        'Common signals:',
        '• -15 or -TERM (SIGTERM) — polite request to exit; processes can clean up',
        '• -9 or -KILL (SIGKILL) — immediate stop; cannot be ignored',
        'This lab practices graceful shutdown with SIGTERM before harder signals.',
      ],
    },
    {
      command: 'ps',
      pattern: 'ps aux | grep <name>',
      summary: 'Verify whether a process is still running.',
      detail: [
        'After kill, run ps again to confirm the process disappeared from the list.',
        'If grep only shows the grep process itself, the target is no longer running.',
        'ps aux lists all processes; piping to grep filters by the script or command name.',
      ],
    },
  ],
  initialState: {
    cwd: '/home/guest/lab-05',
    files: [
      { path: '/home/guest/lab-05/hang.sh', type: 'file', permissions: 'rwxr-xr-x', owner: 'guest' },
    ],
  },
  steps: [
    {
      id: 'step-01-start-hang',
      prompt: 'Launch hang.sh in the background.',
      acceptedCommands: ['./hang.sh &', 'bash hang.sh &', 'sh hang.sh &'],
      expectedOutput: [],
      explanation: 'Background jobs keep running while you return to the shell prompt.',
      hint: 'Run ./hang.sh with & at the end.',
      visual: { focus: 'permissions', labels: ['background', 'hang.sh'], targetPath: '/home/guest/lab-05/hang.sh' },
    },
    {
      id: 'step-02-sigterm',
      prompt: 'Send SIGTERM (signal 15) to stop hang.sh.',
      acceptedCommands: ['kill -15', 'kill -TERM', 'kill -SIGTERM', 'pkill -TERM hang'],
      expectedOutput: [],
      explanation: 'SIGTERM asks a process to shut down gracefully before harder signals.',
      hint: 'Use kill -15 or kill -TERM with the hang.sh PID.',
      visual: { focus: 'permissions', labels: ['SIGTERM', 'kill -15'], targetPath: '/home/guest/lab-05/hang.sh' },
    },
    {
      id: 'step-03-verify-gone',
      prompt: 'Confirm hang.sh is no longer running.',
      acceptedCommands: ['ps aux | grep hang', 'pgrep hang', 'ps aux', 'pgrep -f hang.sh'],
      expectedOutput: [],
      explanation: 'Re-running ps or pgrep shows whether the process survived the signal.',
      hint: 'Use ps or pgrep — you should not see hang.sh running.',
      visual: { focus: 'permissions', labels: ['ps', 'verify'], targetPath: '/home/guest/lab-05/hang.sh' },
    },
  ],
};
