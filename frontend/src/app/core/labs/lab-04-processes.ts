import { Lab } from '../execution/types';

export const LAB_04_PROCESSES: Lab = {
  id: 'lab-04',
  title: 'Process Watch',
  level: 'intermediate',
  durationMinutes: 15,
  xp: 200,
  summary: 'Start a background worker, find it with ps, and stop it cleanly.',
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
      hint: 'Run ./worker.sh with & at the end.',
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
