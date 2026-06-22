import { Injectable } from '@angular/core';
import { ExecutionBackend } from './execution-backend';
import { CommandResult, ExecutionContext, LabState } from './types';

/** Collapse whitespace and trim so "ls   -la " matches "ls -la". */
export function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, ' ');
}

/** Resolve a `cd` target against the current working directory (no symlinks). */
export function resolvePath(cwd: string, target: string): string {
  if (!target || target === '~') {
    return cwd;
  }
  const base = target.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  for (const part of target.split('/')) {
    if (part === '' || part === '.') {
      continue;
    }
    if (part === '..') {
      base.pop();
    } else {
      base.push(part);
    }
  }
  return '/' + base.join('/');
}

/**
 * Pure, deterministic simulation of a small command set, used to keep the
 * visualizers in sync with what the learner typed. It never executes a shell.
 * Returns a new state when the command changes it, otherwise `undefined`.
 */
export function applyCommand(state: LabState, command: string): LabState | undefined {
  const [cmd, ...args] = normalizeCommand(command).split(' ');

  if (cmd === 'cd') {
    return { ...state, cwd: resolvePath(state.cwd, args[0] ?? '~') || '/' };
  }

  if (cmd === 'chmod' && args.length >= 2) {
    const [mode, file] = args;
    const target = resolvePath(state.cwd, file);
    const next = state.files.map((f) =>
      f.path === target || f.path.endsWith('/' + file)
        ? { ...f, permissions: octalToSymbolic(mode) ?? f.permissions }
        : f,
    );
    return { ...state, files: next };
  }

  return undefined;
}

/** Convert an octal mode like "755" to symbolic "rwxr-xr-x". Returns undefined if not octal. */
export function octalToSymbolic(mode: string): string | undefined {
  if (!/^[0-7]{3}$/.test(mode)) {
    return undefined;
  }
  const map = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  return mode
    .split('')
    .map((digit) => map[Number(digit)])
    .join('');
}

/**
 * Default execution backend: matches the typed command against the step's
 * whitelist and returns the scripted output. Deterministic and safe.
 */
@Injectable({ providedIn: 'root' })
export class SimulatedBackend implements ExecutionBackend {
  readonly name = 'simulated';

  run(command: string, { step, state }: ExecutionContext): Promise<CommandResult> {
    const normalized = normalizeCommand(command);
    const accepted = step.acceptedCommands.map(normalizeCommand);
    const correct = accepted.includes(normalized);
    const newState = correct ? applyCommand(state, command) : undefined;

    if (correct) {
      return Promise.resolve({
        correct: true,
        output: step.expectedOutput,
        explanation: step.explanation,
        newState,
      });
    }

    return Promise.resolve({
      correct: false,
      output: [`shellcraft: not the expected command for this step`],
      explanation: step.hint ?? `Try one of: ${step.acceptedCommands.join(', ')}`,
      newState,
    });
  }
}
