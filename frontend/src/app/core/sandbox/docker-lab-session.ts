import { Injectable, computed, inject, signal } from '@angular/core';
import { SandboxCheckResult, SandboxLiveState, SandboxService } from './sandbox.service';

/** Manages a real Linux sandbox session for Docker-enabled labs (PTY via WebSocket). */
@Injectable({ providedIn: 'root' })
export class DockerLabSession {
  private readonly sandbox = inject(SandboxService);

  private readonly _sessionId = signal<string | null>(null);
  private readonly _cwd = signal('/home/guest/lab-01');
  private readonly _checkResult = signal<SandboxCheckResult | null>(null);
  private readonly _liveState = signal<SandboxLiveState | null>(null);
  private readonly _error = signal<string | null>(null);
  private readonly _active = signal(false);

  private readonly _labId = signal<string | null>(null);
  private _startInFlight: Promise<boolean> | null = null;

  readonly active = this._active.asReadonly();
  readonly sessionId = this._sessionId.asReadonly();
  readonly cwd = this._cwd.asReadonly();
  readonly liveState = this._liveState.asReadonly();
  readonly checkResult = this._checkResult.asReadonly();
  readonly error = this._error.asReadonly();
  readonly stepStatuses = computed(() => this._checkResult()?.stepStatuses ?? []);

  readonly stepsCompleted = computed(() => this._checkResult()?.stepsCompleted ?? 0);
  readonly totalSteps = computed(() => this._checkResult()?.totalSteps ?? 0);
  readonly completed = computed(() => this._checkResult()?.completed ?? false);
  readonly progress = computed(() => {
    const total = this.totalSteps();
    return total > 0 ? this.stepsCompleted() / total : 0;
  });
  readonly currentTaskPrompt = computed(() => {
    const result = this._checkResult();
    if (result?.completed) {
      return 'All steps cleared';
    }
    return result?.nextStepPrompt ?? 'Check where this terminal session starts.';
  });

  async start(labId: string): Promise<boolean> {
    if (this._active() && this._labId() === labId && this._sessionId()) {
      return true;
    }
    if (this._startInFlight) {
      return this._startInFlight;
    }

    this._startInFlight = this._doStart(labId).finally(() => {
      this._startInFlight = null;
    });
    return this._startInFlight;
  }

  private async _doStart(labId: string): Promise<boolean> {
    if (this._sessionId()) {
      await this.stop();
    }

    await this.sandbox.probe();
    if (!this.sandbox.available()) {
      this._active.set(false);
      this._labId.set(null);
      return false;
    }

    try {
      const session = await this.sandbox.createSession(labId);
      this._sessionId.set(session.sessionId);
      this._cwd.set(session.cwd);
      this._labId.set(labId);
      this._checkResult.set(null);
      this._liveState.set(null);
      this._error.set(null);
      this._active.set(true);
      return true;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Sandbox unavailable');
      this._active.set(false);
      this._labId.set(null);
      return false;
    }
  }

  applyCheckResult(result: SandboxCheckResult): void {
    this._checkResult.set(result);
    if (result.cwd) {
      this._cwd.set(result.cwd);
    }
    if (result.liveState) {
      this._liveState.set(result.liveState);
    }
    this._error.set(null);
  }

  setLiveState(state: SandboxLiveState): void {
    this._liveState.set(state);
  }

  async checkWork(): Promise<SandboxCheckResult | null> {
    const sessionId = this._sessionId();
    if (!sessionId) {
      return null;
    }

    try {
      const result = await this.sandbox.check(sessionId);
      this.applyCheckResult(result);
      return result;
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Check failed');
      return null;
    }
  }

  setCwd(cwd: string): void {
    this._cwd.set(cwd);
  }

  async reset(labId: string): Promise<void> {
    await this.stop();
    await this.start(labId);
  }

  async stop(): Promise<void> {
    const sessionId = this._sessionId();
    if (sessionId) {
      await this.sandbox.destroy(sessionId);
    }
    this._sessionId.set(null);
    this._labId.set(null);
    this._checkResult.set(null);
    this._liveState.set(null);
    this._active.set(false);
  }
}
