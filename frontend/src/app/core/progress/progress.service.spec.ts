import { TestBed } from '@angular/core/testing';
import {
  FIRST_STEPS_BADGE,
  LAB_BADGES,
  MemoryStore,
  PROGRESS_STORAGE,
  ProgressService,
} from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    TestBed.configureTestingModule({
      providers: [ProgressService, { provide: PROGRESS_STORAGE, useValue: store }],
    });
    service = TestBed.inject(ProgressService);
  });

  it('starts empty', () => {
    expect(service.xp()).toBe(0);
    expect(service.completedCount()).toBe(0);
    expect(service.badges()).toEqual([]);
  });

  it('grants XP and badges on lab completion', () => {
    service.completeLab('lab-02', 150);
    expect(service.xp()).toBe(150);
    expect(service.completedCount()).toBe(1);
    expect(service.isCompleted('lab-02')).toBe(true);
    expect(service.badges()).toContain(FIRST_STEPS_BADGE.id);
    expect(service.badges()).toContain(LAB_BADGES['lab-02'].id);
    expect(service.streak()).toBe(1);
  });

  it('does not double-count a repeated completion', () => {
    service.completeLab('lab-02', 150);
    service.completeLab('lab-02', 150);
    expect(service.xp()).toBe(150);
    expect(service.completedCount()).toBe(1);
  });

  it('unlocks a lab only after its prerequisite is complete', () => {
    expect(service.isUnlocked('lab-01')).toBe(true);
    expect(service.isUnlocked('lab-02', 'lab-01')).toBe(false);
    service.completeLab('lab-01', 120);
    expect(service.isUnlocked('lab-02', 'lab-01')).toBe(true);
  });

  it('persists across service instances via the shared store', () => {
    service.completeLab('lab-01', 120);
    const fresh = TestBed.runInInjectionContext(() => new ProgressService());
    expect(fresh.xp()).toBe(120);
    expect(fresh.isCompleted('lab-01')).toBe(true);
  });

  it('reset clears progress', () => {
    service.completeLab('lab-01', 120);
    service.reset();
    expect(service.xp()).toBe(0);
    expect(service.completedCount()).toBe(0);
  });
});
