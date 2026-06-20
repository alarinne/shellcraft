import {
  applyCommand,
  normalizeCommand,
  octalToSymbolic,
  resolvePath,
  SimulatedBackend,
} from './simulated-backend';
import { ExecutionContext, LabState, LabStep } from './types';

const step: LabStep = {
  id: 'step-02-chmod',
  prompt: 'Run chmod 755 deploy.sh',
  acceptedCommands: ['chmod 755 deploy.sh'],
  expectedOutput: ['mode changed: deploy.sh -> rwxr-xr-x'],
  explanation: 'Owner keeps write while group/others read+execute.',
  hint: '7 = rwx, 5 = r-x.',
};

const state: LabState = {
  cwd: '/home/guest/projects',
  files: [
    { path: '/home/guest/projects/deploy.sh', type: 'file', permissions: 'rw-r--r--', owner: 'guest' },
  ],
};

describe('command helpers', () => {
  it('normalizes whitespace', () => {
    expect(normalizeCommand('  ls   -la ')).toBe('ls -la');
  });

  it('converts octal modes to symbolic', () => {
    expect(octalToSymbolic('755')).toBe('rwxr-xr-x');
    expect(octalToSymbolic('644')).toBe('rw-r--r--');
    expect(octalToSymbolic('abc')).toBeUndefined();
  });

  it('resolves cd paths', () => {
    expect(resolvePath('/home/guest', 'projects')).toBe('/home/guest/projects');
    expect(resolvePath('/home/guest/projects', '..')).toBe('/home/guest');
    expect(resolvePath('/home/guest', '/etc')).toBe('/etc');
  });

  it('applies cd and chmod to produce new state', () => {
    expect(applyCommand(state, 'cd ..')?.cwd).toBe('/home/guest');
    const chmodded = applyCommand(state, 'chmod 755 deploy.sh');
    expect(chmodded?.files[0].permissions).toBe('rwxr-xr-x');
    expect(applyCommand(state, 'pwd')).toBeUndefined();
  });
});

describe('SimulatedBackend', () => {
  const backend = new SimulatedBackend();
  const ctx: ExecutionContext = { step, state };

  it('accepts a whitelisted command and returns scripted output', async () => {
    const result = await backend.run('chmod 755 deploy.sh', ctx);
    expect(result.correct).toBe(true);
    expect(result.output).toEqual(['mode changed: deploy.sh -> rwxr-xr-x']);
    expect(result.newState?.files[0].permissions).toBe('rwxr-xr-x');
  });

  it('rejects a wrong command and surfaces the hint', async () => {
    const result = await backend.run('chmod 777 deploy.sh', ctx);
    expect(result.correct).toBe(false);
    expect(result.explanation).toBe('7 = rwx, 5 = r-x.');
  });

  it('never mutates the input state', async () => {
    await backend.run('chmod 755 deploy.sh', ctx);
    expect(state.files[0].permissions).toBe('rw-r--r--');
  });
});
