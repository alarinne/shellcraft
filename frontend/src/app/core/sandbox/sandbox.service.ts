import { Injectable, signal } from '@angular/core';
import { API_BASE } from '../api/api-base';
import { TerminalEntry } from '../execution/lab-engine';

export interface SandboxStatus {
  enabled: boolean;
  imageReady: boolean;
  image: string;
  activeSessions: number;
}

export interface SandboxStepStatus {
  id: string;
  prompt: string;
  completed: boolean;
  reason: string | null;
}

export interface SandboxCheckResult {
  completed: boolean;
  stepsCompleted: number;
  totalSteps: number;
  completedStepIds: string[];
  nextStepId: string | null;
  nextStepPrompt: string | null;
  message: string;
  labId: string;
  cwd?: string;
  stepStatuses: SandboxStepStatus[];
}

@Injectable({ providedIn: 'root' })
export class SandboxService {
  private readonly _available = signal(false);
  readonly available = this._available.asReadonly();

  async probe(): Promise<SandboxStatus | null> {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) {
        this._available.set(false);
        return null;
      }
      const body = (await res.json()) as { sandbox?: SandboxStatus };
      const sandbox = body.sandbox;
      const ready = !!sandbox?.enabled && !!sandbox?.imageReady;
      this._available.set(ready);
      return sandbox ?? null;
    } catch {
      this._available.set(false);
      return null;
    }
  }

  async createSession(labId: string): Promise<{ sessionId: string; cwd: string; prompt: string }> {
    const res = await fetch(`${API_BASE}/api/sandbox/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || 'Failed to start sandbox session');
    }
    return res.json();
  }

  async exec(
    sessionId: string,
    command: string,
  ): Promise<{ output: string[]; cwd: string; prompt: string; exitCode: number }> {
    const res = await fetch(`${API_BASE}/api/sandbox/sessions/${sessionId}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || 'Sandbox exec failed');
    }
    const body = await res.json();
    return {
      output: body.output ?? body.stdout ?? [],
      cwd: body.cwd,
      prompt: body.prompt,
      exitCode: body.exitCode ?? 0,
    };
  }

  async check(sessionId: string): Promise<SandboxCheckResult> {
    const res = await fetch(`${API_BASE}/api/sandbox/sessions/${sessionId}/check`, {
      method: 'POST',
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail || 'Sandbox check failed');
    }
    return res.json();
  }

  async destroy(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/api/sandbox/sessions/${sessionId}`, { method: 'DELETE' });
  }

  toTerminalEntry(prompt: string, command: string, output: string[], exitCode: number): TerminalEntry {
    return {
      prompt,
      command,
      output,
      correct: exitCode === 0,
    };
  }
}
