/** HTTP API base — empty string uses the dev-server proxy to :8000. */
export const API_BASE = '';

/**
 * WebSocket URL for the sandbox PTY terminal.
 * Angular's dev proxy does not reliably upgrade WebSockets, so in local dev we
 * connect straight to the FastAPI backend on port 8000.
 */
export function sandboxTerminalWsUrl(sessionId: string): string {
  const { protocol, hostname, port, host } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

  if (port === '4200' || port === '4201') {
    return `${wsProtocol}//${hostname}:8000/api/sandbox/sessions/${sessionId}/terminal`;
  }

  return `${wsProtocol}//${host}/api/sandbox/sessions/${sessionId}/terminal`;
}
