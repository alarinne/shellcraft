/** Minimal, deterministic model of how POSIX signals affect a process. */

export type PosixSignal = 'SIGINT' | 'SIGTERM' | 'SIGKILL' | 'SIGSTOP' | 'SIGCONT';
export type ProcStatus = 'running' | 'stopped' | 'terminated';

export interface Proc {
  pid: number;
  name: string;
  status: ProcStatus;
  /** Whether the process can install a handler for catchable signals. */
  catchable: boolean;
}

export interface SignalInfo {
  signal: PosixSignal;
  number: number;
  label: string;
  /** SIGKILL and SIGSTOP can never be caught, blocked, or ignored. */
  catchable: boolean;
}

export const SIGNALS: readonly SignalInfo[] = [
  { signal: 'SIGINT', number: 2, label: 'Interrupt (Ctrl-C)', catchable: true },
  { signal: 'SIGTERM', number: 15, label: 'Graceful terminate', catchable: true },
  { signal: 'SIGKILL', number: 9, label: 'Forced kill', catchable: false },
  { signal: 'SIGSTOP', number: 19, label: 'Pause', catchable: false },
  { signal: 'SIGCONT', number: 18, label: 'Resume', catchable: true },
];

export interface SignalOutcome {
  proc: Proc;
  message: string;
}

/** Apply `signal` to `proc`, returning the new process state and an explanation. */
export function applySignal(proc: Proc, signal: PosixSignal): SignalOutcome {
  if (proc.status === 'terminated') {
    return { proc, message: `${proc.name} (${proc.pid}) is already terminated.` };
  }

  switch (signal) {
    case 'SIGKILL':
      return {
        proc: { ...proc, status: 'terminated' },
        message: `SIGKILL (9): ${proc.name} killed immediately — no cleanup, cannot be caught.`,
      };
    case 'SIGSTOP':
      return {
        proc: { ...proc, status: 'stopped' },
        message: `SIGSTOP (19): ${proc.name} paused — cannot be caught.`,
      };
    case 'SIGCONT':
      return {
        proc: { ...proc, status: 'running' },
        message: `SIGCONT (18): ${proc.name} resumed.`,
      };
    case 'SIGINT':
    case 'SIGTERM': {
      const graceful = proc.catchable
        ? `caught the signal, cleaned up, and exited gracefully`
        : `did not handle it and was terminated`;
      return {
        proc: { ...proc, status: 'terminated' },
        message: `${signal}: ${proc.name} ${graceful}.`,
      };
    }
  }
}
