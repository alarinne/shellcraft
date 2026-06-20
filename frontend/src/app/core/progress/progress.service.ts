import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';

export interface Badge {
  id: string;
  label: string;
}

/** Minimal key/value store the progress service depends on. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory fallback used when `localStorage` is unavailable or non-functional. */
export class MemoryStore implements KeyValueStore {
  private readonly map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) ?? null) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

/** Resolve a usable store: real `localStorage` if functional, else in-memory. */
export function resolveStore(): KeyValueStore {
  const ls = globalThis.localStorage as unknown as KeyValueStore | undefined;
  if (ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function') {
    return ls;
  }
  return new MemoryStore();
}

/** DI token for the persistence store (swappable in tests). */
export const PROGRESS_STORAGE = new InjectionToken<KeyValueStore>('PROGRESS_STORAGE', {
  providedIn: 'root',
  factory: resolveStore,
});

export interface ProgressData {
  xp: number;
  completed: string[];
  badges: string[];
  streak: number;
  lastActive: string | null;
}

/** Badge awarded for finishing a specific lab. */
export const LAB_BADGES: Readonly<Record<string, Badge>> = {
  'lab-01': { id: 'filesystem-explorer', label: 'Filesystem Explorer' },
  'lab-02': { id: 'permission-core', label: 'Permission Core' },
  'lab-03': { id: 'pipe-plumber', label: 'Pipe Plumber' },
};

export const FIRST_STEPS_BADGE: Badge = { id: 'first-steps', label: 'First Steps' };

const STORAGE_KEY = 'shellcraft.progress';

const EMPTY: ProgressData = { xp: 0, completed: [], badges: [], streak: 0, lastActive: null };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/**
 * Persists gamification state (XP, completed labs, badges, streak) in
 * `localStorage`. Lab unlocking is derived from completion. Designed to be
 * namespaced per user once auth lands (#7).
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly store = inject(PROGRESS_STORAGE);
  private namespace = '';
  private readonly data = signal<ProgressData>(this.load());

  readonly xp = computed(() => this.data().xp);
  readonly completedCount = computed(() => this.data().completed.length);
  readonly streak = computed(() => this.data().streak);
  readonly badges = computed(() => this.data().badges);

  /** Scope progress to a user (called by AuthService in #7). */
  useNamespace(namespace: string): void {
    this.namespace = namespace;
    this.data.set(this.load());
  }

  isCompleted(labId: string): boolean {
    return this.data().completed.includes(labId);
  }

  /** A lab is unlocked when it has no prerequisite or the prerequisite is done. */
  isUnlocked(labId: string, previousLabId?: string): boolean {
    return !previousLabId || this.isCompleted(previousLabId);
  }

  /** Record a finished lab: grant XP once, unlock badges, bump the streak. */
  completeLab(labId: string, xp: number): void {
    this.data.update((d) => {
      if (d.completed.includes(labId)) {
        return d;
      }
      const badges = new Set(d.badges);
      if (d.completed.length === 0) {
        badges.add(FIRST_STEPS_BADGE.id);
      }
      const labBadge = LAB_BADGES[labId];
      if (labBadge) {
        badges.add(labBadge.id);
      }
      return {
        xp: d.xp + xp,
        completed: [...d.completed, labId],
        badges: [...badges],
        streak: this.nextStreak(d),
        lastActive: today(),
      };
    });
    this.save();
  }

  reset(): void {
    this.data.set({ ...EMPTY });
    this.save();
  }

  private nextStreak(d: ProgressData): number {
    if (!d.lastActive) {
      return 1;
    }
    const gap = daysBetween(d.lastActive, today());
    if (gap === 0) {
      return d.streak;
    }
    return gap === 1 ? d.streak + 1 : 1;
  }

  private storageKey(): string {
    return this.namespace ? `${STORAGE_KEY}:${this.namespace}` : STORAGE_KEY;
  }

  private load(): ProgressData {
    try {
      const raw = this.store.getItem(this.storageKey());
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
    } catch {
      return { ...EMPTY };
    }
  }

  private save(): void {
    try {
      this.store.setItem(this.storageKey(), JSON.stringify(this.data()));
    } catch {
      /* storage unavailable — progress stays in-memory for this session */
    }
  }
}
