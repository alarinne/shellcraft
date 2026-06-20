import { InjectionToken } from '@angular/core';
import { CommandResult, ExecutionContext } from './types';

/**
 * Strategy for executing a learner's command, per ADR-0002 (hybrid execution).
 *
 * Implementations:
 * - `SimulatedBackend` (default): deterministic, never runs a real shell.
 * - `DockerSandboxBackend` (opt-in, #9): runs real commands in a hardened
 *   ephemeral container.
 *
 * The terminal and `LabEngine` depend only on this interface.
 */
export interface ExecutionBackend {
  /** Human-readable backend id, e.g. "simulated" or "docker-sandbox". */
  readonly name: string;
  /** Evaluate `command` against the current step and state. */
  run(command: string, context: ExecutionContext): Promise<CommandResult>;
}

/** DI token resolving the active execution backend. */
export const EXECUTION_BACKEND = new InjectionToken<ExecutionBackend>('EXECUTION_BACKEND');
