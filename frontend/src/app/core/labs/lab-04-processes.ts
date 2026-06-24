import { Lab } from '../execution/types';

export const LAB_04_PROCESSES: Lab = {
  id: 'lab-04',
  title: 'Process Watch',
  level: 'intermediate',
  durationMinutes: 15,
  xp: 200,
  summary: 'Start a background worker, find it with ps, and stop it cleanly.',
  commandGuide: [
    {
      command: '&',
      pattern: '<command> &',
      summary: 'Run a command in the background.',
      detail: [
        'Appending & to a command starts it as a background job. Your shell prompt returns immediately while the process keeps running.',
        'Example: ./worker.sh & launches the script without blocking the terminal. Use jobs to list background tasks in this shell.',
      ],
    },
    {
      command: 'ps',
      pattern: 'ps [options]',
      summary: 'List processes that are currently running.',
      detail: [
        'ps shows process information. Plain ps lists processes tied to your terminal; ps aux shows all processes with user-oriented columns.',
        'Combine with grep to find a name: ps aux | grep worker filters the list to lines containing “worker”.',
        'Columns often include PID (process id), which you need for kill.',
      ],
    },
    {
      command: 'pkill',
      pattern: 'pkill <name>',
      summary: 'Stop processes by name instead of PID.',
      detail: [
        'pkill sends a signal to processes whose name matches. pkill -f worker.sh matches the full command line.',
        'Default signal is SIGTERM (graceful shutdown). Without -f, only the process name field is matched.',
        'Use when you know the script name but not the PID from ps.',
      ],
    },
  ],
  initialState: {
    cwd: '/home/guest/lab-04',
    files: [
      { path: '/home/guest/lab-04/worker.sh', type: 'file', permissions: 'rwxr-xr-x', owner: 'guest' },
    ],
  },
  steps: [
    {
      id: 'step-01-start-worker',
      prompt: 'Start worker.sh in the background.',
      acceptedCommands: ['./worker.sh &', 'bash worker.sh &', 'sh worker.sh &', './worker.sh & disown'],
      expectedOutput: [],
      explanation: 'Appending & runs a command in the background so your shell stays free.',
      hint: 'Run ./worker.sh, bash worker.sh, or sh worker.sh with & at the end.',
      visual: { focus: 'permissions', labels: ['background', 'worker.sh'], targetPath: '/home/guest/lab-04/worker.sh' },
    },
    {
      id: 'step-02-find-worker',
      prompt: 'List processes and locate the worker.',
      acceptedCommands: ['ps', 'ps aux', 'ps aux | grep worker', 'pgrep -f worker', 'pgrep worker'],
      expectedOutput: [],
      explanation: 'ps shows running processes; grep or pgrep helps you spot the worker by name.',
      hint: 'Use ps or pgrep to find worker.sh.',
      visual: { focus: 'permissions', labels: ['ps', 'grep worker'], targetPath: '/home/guest/lab-04/worker.sh' },
    },
    {
      id: 'step-03-stop-worker',
      prompt: 'Stop the worker process.',
      acceptedCommands: ['pkill -f worker.sh', 'pkill worker', 'killall worker.sh'],
      expectedOutput: [],
      explanation: 'kill and pkill send signals that terminate running processes.',
      hint: 'Use pkill or kill with the worker PID.',
      visual: { focus: 'permissions', labels: ['pkill', 'stop'], targetPath: '/home/guest/lab-04/worker.sh' },
    },
  ],
};
