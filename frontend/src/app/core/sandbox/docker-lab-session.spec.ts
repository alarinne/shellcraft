import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { DockerLabSession } from './docker-lab-session';
import { SandboxService } from './sandbox.service';

describe('DockerLabSession', () => {
  it('reuses an existing session when start is called again for the same lab', async () => {
    const available = signal(true);
    const sandbox = {
      probe: vi.fn().mockResolvedValue({ enabled: true, imageReady: true }),
      available,
      createSession: vi.fn().mockResolvedValue({
        sessionId: 'abc',
        cwd: '/home/guest/projects',
        prompt: 'guest@shellcraft:/home/guest/projects$',
      }),
      check: vi.fn(),
      destroy: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [{ provide: SandboxService, useValue: sandbox }],
    }).compileComponents();

    const session = TestBed.inject(DockerLabSession);
    await session.start('lab-01');
    await session.start('lab-01');

    expect(sandbox.createSession).toHaveBeenCalledTimes(1);
    expect(sandbox.destroy).not.toHaveBeenCalled();
    expect(session.sessionId()).toBe('abc');
  });

  it('destroys the previous session when switching labs', async () => {
    const available = signal(true);
    const sandbox = {
      probe: vi.fn().mockResolvedValue({ enabled: true, imageReady: true }),
      available,
      createSession: vi
        .fn()
        .mockResolvedValueOnce({
          sessionId: 'abc',
          cwd: '/home/guest/projects',
          prompt: 'guest@shellcraft:/home/guest/projects$',
        })
        .mockResolvedValueOnce({
          sessionId: 'def',
          cwd: '/home/guest/projects',
          prompt: 'guest@shellcraft:/home/guest/projects$',
        }),
      check: vi.fn(),
      destroy: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [{ provide: SandboxService, useValue: sandbox }],
    }).compileComponents();

    const session = TestBed.inject(DockerLabSession);
    await session.start('lab-01');
    await session.start('lab-02');

    expect(sandbox.destroy).toHaveBeenCalledTimes(1);
    expect(session.sessionId()).toBe('def');
  });

  it('starts a session when the sandbox is available', async () => {
    const available = signal(true);
    const sandbox = {
      probe: vi.fn().mockResolvedValue({ enabled: true, imageReady: true }),
      available,
      createSession: vi.fn().mockResolvedValue({
        sessionId: 'abc',
        cwd: '/home/guest/projects',
        prompt: 'guest@shellcraft:/home/guest/projects$',
      }),
      check: vi.fn(),
      destroy: vi.fn(),
    };

    await TestBed.configureTestingModule({
      providers: [{ provide: SandboxService, useValue: sandbox }],
    }).compileComponents();

    const session = TestBed.inject(DockerLabSession);
    const started = await session.start('lab-01');

    expect(started).toBe(true);
    expect(session.active()).toBe(true);
    expect(session.cwd()).toBe('/home/guest/projects');
    expect(session.sessionId()).toBe('abc');
  });

  it('applies check results and cwd updates', async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: SandboxService, useValue: { available: signal(false).asReadonly() } }],
    }).compileComponents();

    const session = TestBed.inject(DockerLabSession);
    session.applyCheckResult({
      completed: false,
      stepsCompleted: 2,
      totalSteps: 5,
      completedStepIds: ['step-01-orient', 'step-02-scan-projects'],
      nextStepId: 'step-03-enter-labs',
      nextStepPrompt: 'Move into the labs directory.',
      message: 'Not complete yet:\n• Run `cd labs` to move into the labs directory.',
      labId: 'lab-01',
      cwd: '/home/guest/projects/labs',
      stepStatuses: [
        { id: 'step-01-orient', prompt: 'Check where this terminal session starts.', completed: true, reason: null },
        { id: 'step-02-scan-projects', prompt: 'List this directory and spot the labs folder.', completed: true, reason: null },
        { id: 'step-03-enter-labs', prompt: 'Move into the labs directory.', completed: false, reason: 'Run `cd labs` to move into the labs directory.' },
        { id: 'step-04-find-mission', prompt: 'List the lab directory and find the mission file.', completed: false, reason: 'Inside labs, run `ls` to find mission.txt.' },
        { id: 'step-05-read-mission', prompt: 'Read mission.txt to complete the filesystem quest.', completed: false, reason: 'Run `cat mission.txt` to read the mission file.' },
      ],
    });

    expect(session.stepsCompleted()).toBe(2);
    expect(session.cwd()).toBe('/home/guest/projects/labs');
  });
});
