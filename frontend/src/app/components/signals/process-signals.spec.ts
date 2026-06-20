import { applySignal, Proc } from './process-signals';

function proc(over: Partial<Proc> = {}): Proc {
  return { pid: 1, name: 'demo', status: 'running', catchable: true, ...over };
}

describe('applySignal', () => {
  it('SIGKILL terminates immediately, even uncatchable processes', () => {
    const out = applySignal(proc({ catchable: false }), 'SIGKILL');
    expect(out.proc.status).toBe('terminated');
    expect(out.message).toContain('no cleanup');
  });

  it('SIGTERM lets a catchable process exit gracefully', () => {
    const out = applySignal(proc({ catchable: true }), 'SIGTERM');
    expect(out.proc.status).toBe('terminated');
    expect(out.message).toContain('gracefully');
  });

  it('SIGTERM on an uncatchable process just terminates it', () => {
    const out = applySignal(proc({ catchable: false }), 'SIGTERM');
    expect(out.proc.status).toBe('terminated');
    expect(out.message).toContain('did not handle it');
  });

  it('SIGSTOP pauses and SIGCONT resumes', () => {
    const stopped = applySignal(proc(), 'SIGSTOP');
    expect(stopped.proc.status).toBe('stopped');
    const resumed = applySignal(stopped.proc, 'SIGCONT');
    expect(resumed.proc.status).toBe('running');
  });

  it('is a no-op on an already terminated process', () => {
    const out = applySignal(proc({ status: 'terminated' }), 'SIGKILL');
    expect(out.message).toContain('already terminated');
  });
});
