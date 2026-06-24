/** Live container facts returned by the sandbox check API and PTY WebSocket. */
export interface SandboxLiveState {
  deployMode?: string;
  deployExecutable?: boolean;
  missionExists?: boolean;
  logExists?: boolean;
  workerRunning?: boolean;
  hangRunning?: boolean;
}

/** Convert `stat -c %A` output (e.g. `-rwxr-xr-x`) to a 9-char mode for the visual map. */
export function permissionsFromStatMode(mode: string): string {
  const trimmed = mode.trim();
  const withoutType = trimmed.startsWith('-') || trimmed.startsWith('d') ? trimmed.slice(1) : trimmed;
  return withoutType.slice(-9).padStart(9, '-');
}
