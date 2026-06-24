import { API_BASE } from './api-base';

/** Result of an API call: discriminated by `ok`. */
export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Thin `fetch` wrapper for the ShellCraft backend.
 *
 * - Sends the session cookie (`credentials: 'include'`) so auth works
 *   same-origin (dev proxy / nginx) and cross-origin in local dev.
 * - JSON-encodes object bodies and parses JSON responses.
 * - Normalizes FastAPI error shapes (`{ detail }` or 422 validation arrays)
 *   into a friendly `error` string instead of throwing.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init;
  const requestInit: RequestInit = {
    credentials: 'include',
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
    },
  };
  if (json !== undefined) {
    requestInit.body = JSON.stringify(json);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, requestInit);
  } catch {
    return { ok: false, status: 0, error: 'Cannot reach the server. Is it running?' };
  }

  const body = await readBody(res);
  if (!res.ok) {
    return { ok: false, status: res.status, error: extractError(body, res.status) };
  }
  return { ok: true, status: res.status, data: body as T };
}

async function readBody(res: Response): Promise<unknown> {
  let text = '';
  try {
    text = await res.text();
  } catch {
    return null;
  }
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractError(body: unknown, status: number): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  if (body && typeof body === 'object') {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (first?.msg) {
        return first.msg;
      }
    }
  }
  return defaultMessageForStatus(status);
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 401:
      return 'You need to sign in to do that.';
    case 403:
      return 'You do not have access to that.';
    case 404:
      return 'Not found.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
