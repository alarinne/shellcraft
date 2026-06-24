import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { vi } from 'vitest';

export interface MockResponse {
  status?: number;
  body?: unknown;
}

export type RouteResponder =
  | MockResponse
  | ((init: RequestInit | undefined, url: string) => MockResponse);

export interface ApiMock {
  handler: ReturnType<typeof vi.fn>;
  calls: { method: string; url: string; body: unknown }[];
}

/**
 * Stub global `fetch` with a table of `"METHOD /path"` responders so specs can
 * exercise the cookie-session flow without a real backend.
 */
export function installApiMock(routes: Record<string, RouteResponder>): ApiMock {
  const calls: { method: string; url: string; body: unknown }[] = [];

  const handler = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method ?? 'GET').toUpperCase();
    calls.push({ method, url, body: parseBody(init?.body) });

    const responder = routes[`${method} ${stripQuery(url)}`];
    const res: MockResponse =
      responder === undefined
        ? { status: 404, body: { detail: 'not found' } }
        : typeof responder === 'function'
          ? responder(init, url)
          : responder;
    return makeResponse(res);
  });

  vi.stubGlobal('fetch', handler);
  return { handler, calls };
}

/**
 * Flush Angular effects and let pending mock-fetch promises settle. The auth /
 * progress / settings flows chain an effect -> microtask -> fetch -> signal set,
 * so we tick a few times.
 */
export async function settle(rounds = 6): Promise<void> {
  const appRef = TestBed.inject(ApplicationRef);
  for (let i = 0; i < rounds; i += 1) {
    appRef.tick();
    await Promise.resolve();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

function stripQuery(url: string): string {
  const queryIndex = url.indexOf('?');
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

function parseBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== 'string') {
    return body ?? null;
  }
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function makeResponse(res: MockResponse): Response {
  const status = res.status ?? 200;
  const text =
    res.body === undefined ? '' : typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return text;
    },
    async json() {
      return text ? JSON.parse(text) : null;
    },
  } as unknown as Response;
}
