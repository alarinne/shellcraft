/**
 * Core data shapes for ShellCraft labs and command execution.
 *
 * These mirror `docs/lab-json-schema.md` and the `POST /api/commands/check`
 * contract in `docs/api-contract.md`. Lab content is data — never code to run.
 */

export type LabLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LabFile {
  path: string;
  type: 'file' | 'dir';
  permissions: string; // e.g. "rwxr-xr-x"
  owner: string;
}

export interface LabState {
  cwd: string;
  files: LabFile[];
  env?: Record<string, string>;
}

export interface LabStep {
  id: string;
  prompt: string;
  /** Whitelist of accepted command strings for this step. */
  acceptedCommands: string[];
  expectedOutput: string[];
  explanation: string;
  hint?: string;
  /** UI hints for the visualizers (filesystem focus, permission diagram, …). */
  visual?: {
    focus?: string;
    labels?: string[];
    targetPath?: string;
  };
}

export interface Lab {
  id: string;
  title: string;
  level: LabLevel;
  durationMinutes: number;
  xp: number;
  summary: string;
  initialState: LabState;
  steps: LabStep[];
}

/** Result of evaluating a single command against the active step + state. */
export interface CommandResult {
  correct: boolean;
  output: string[];
  explanation?: string;
  /** Id of the next step, or `null` when the lab is complete. */
  nextStepId?: string | null;
  /** Updated simulated state after the command, if it changed anything. */
  newState?: LabState;
}

/** Context handed to an execution backend for a single command. */
export interface ExecutionContext {
  step: LabStep;
  state: LabState;
}
