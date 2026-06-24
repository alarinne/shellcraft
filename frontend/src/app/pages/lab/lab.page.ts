import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { FilesystemMapComponent } from '../../components/filesystem-map/filesystem-map.component';
import { PtyTerminalComponent } from '../../components/terminal/pty-terminal.component';
import { TerminalComponent } from '../../components/terminal/terminal.component';
import { CommandResult, Lab, LabFile, LabState } from '../../core/execution/types';
import { LabEngine } from '../../core/execution/lab-engine';
import { getLab, DOCKER_LAB_IDS } from '../../core/labs';
import { LAB_01_FILESYSTEM } from '../../core/labs/lab-01-filesystem';
import { AuthService } from '../../core/auth/auth.service';
import { LabProgress } from '../../core/progress/lab-progress';
import { DockerLabSession } from '../../core/sandbox/docker-lab-session';
import { permissionsFromStatMode, SandboxLiveState } from '../../core/sandbox/live-state';
import { SandboxCheckResult, SandboxStepStatus } from '../../core/sandbox/sandbox.service';

interface PermissionRow {
  role: 'Owner' | 'Group' | 'Others';
  value: string;
  tone: 'blue' | 'purple' | 'orange';
}

const DEFAULT_LAB: Lab = LAB_01_FILESYSTEM;

@Component({
  selector: 'sc-lab-page',
  imports: [FilesystemMapComponent, TerminalComponent, PtyTerminalComponent],
  templateUrl: './lab.page.html',
})
export class LabPage {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly engine = inject(LabEngine);
  private readonly progress = inject(LabProgress);
  private readonly auth = inject(AuthService);
  protected readonly dockerSession = inject(DockerLabSession);

  readonly id = input<string>();

  protected readonly hintVisible = signal(false);
  protected readonly busy = signal(false);
  protected readonly lastResult = signal<CommandResult | null>(null);
  protected readonly dockerMode = signal(false);
  protected readonly checkMessage = signal<string | null>(null);
  protected readonly dockerChecked = signal(false);

  protected readonly lab = computed(() => getLab(this.id()) ?? DEFAULT_LAB);
  protected readonly usesDocker = computed(
    () => this.dockerMode() && DOCKER_LAB_IDS.has(this.lab().id),
  );
  protected readonly sandboxSessionId = computed(() => this.dockerSession.sessionId());
  protected readonly progressPercent = computed(() =>
    this.usesDocker()
      ? Math.round(this.dockerSession.progress() * 100)
      : Math.round(this.engine.progress() * 100),
  );
  protected readonly completedStepCount = computed(() =>
    this.usesDocker()
      ? this.dockerSession.stepsCompleted()
      : Math.min(this.engine.totalSteps(), this.engine.stepIndex()),
  );
  protected readonly totalSteps = computed(() =>
    this.usesDocker() ? this.dockerSession.totalSteps() : this.engine.totalSteps(),
  );
  protected readonly labCompleted = computed(() =>
    this.usesDocker() ? this.dockerSession.completed() : this.engine.completed(),
  );
  protected readonly currentTaskPrompt = computed(() => {
    if (this.labCompleted()) {
      return 'All steps cleared';
    }
    if (this.usesDocker()) {
      return 'Work through the tasks below, then click Check my work.';
    }
    return this.engine.currentStep()?.prompt ?? '';
  });
  protected readonly dockerStepStatuses = computed((): SandboxStepStatus[] => {
    if (!this.usesDocker()) {
      return [];
    }
    const checked = this.dockerSession.stepStatuses();
    if (checked.length > 0) {
      return checked;
    }
    return this.lab().steps.map((step) => ({
      id: step.id,
      prompt: step.prompt,
      completed: false,
      reason: null,
    }));
  });
  protected readonly terminalHistory = computed(() => this.engine.history());
  protected readonly terminalPrompt = computed(
    () => `guest@shellcraft:${this.engine.state()?.cwd ?? '~'}$`,
  );
  protected readonly filesystemState = computed((): LabState | null => {
    if (this.usesDocker()) {
      const lab = this.lab();
      const liveState = this.dockerSession.liveState();
      return {
        cwd: this.dockerSession.cwd(),
        files: lab.initialState.files.map((file) => {
          const copy = { ...file };
          if (file.path.endsWith('/deploy.sh') && liveState?.deployMode) {
            copy.permissions = permissionsFromStatMode(liveState.deployMode);
          }
          return copy;
        }),
      };
    }
    return this.engine.state();
  });
  protected readonly visualTargetPath = computed(() => {
    if (this.usesDocker()) {
      const pending = this.dockerStepStatuses().find((step) => !step.completed);
      const step = this.lab().steps.find((item) => item.id === pending?.id);
      return step?.visual?.targetPath ?? this.dockerSession.cwd();
    }
    return this.engine.currentStep()?.visual?.targetPath;
  });
  protected readonly focusFile = computed(() => this.filesystemState()?.files[0] ?? null);
  protected readonly visualFocus = computed(() => {
    if (this.usesDocker()) {
      const pending = this.dockerStepStatuses().find((step) => !step.completed);
      const step = this.lab().steps.find((item) => item.id === pending?.id);
      return step?.visual?.focus;
    }
    return this.engine.currentStep()?.visual?.focus;
  });
  protected readonly showFilesystemMap = computed(
    () =>
      this.lab().id === 'lab-01' ||
      this.lab().id === 'lab-03' ||
      this.visualFocus() === 'filesystem',
  );
  protected readonly permissionRows = computed<PermissionRow[]>(() => {
    const [owner, group, others] = splitPermissions(this.focusFile()?.permissions);
    return [
      { role: 'Owner', value: owner, tone: 'blue' },
      { role: 'Group', value: group, tone: 'purple' },
      { role: 'Others', value: others, tone: 'orange' },
    ];
  });
  protected readonly explanation = computed(
    () => this.lastResult()?.explanation ?? this.checkMessage() ?? this.dockerSession.error() ?? '',
  );
  protected readonly filesystemCwd = computed(
    () => this.filesystemState()?.cwd ?? 'workspace',
  );

  constructor() {
    effect(() => {
      const lab = this.lab();
      this.engine.load(lab);
      this.hintVisible.set(false);
      this.lastResult.set(null);
      this.checkMessage.set(null);
      this.dockerChecked.set(false);
    });

    // Start docker only when the lab id changes. Never tear down in effect
    // cleanup — that runs on every re-run (e.g. route input settling) and was
    // killing the container every second.
    effect(() => {
      const labId = this.lab().id;
      if (!DOCKER_LAB_IDS.has(labId)) {
        untracked(() => {
          void this.dockerSession.stop();
          this.dockerMode.set(false);
        });
        return;
      }

      void this.dockerSession.start(labId).then((started) => {
        untracked(() => this.dockerMode.set(started));
      });
    });

    this.destroyRef.onDestroy(() => {
      void this.dockerSession.stop();
      this.dockerMode.set(false);
    });

    effect(() => {
      const labId = this.id();
      if (!labId || !this.auth.isAuthenticated()) {
        return;
      }
      void this.progress.ensureLoaded().then(() => {
        if (!this.progress.isLabUnlocked(labId)) {
          void this.router.navigate(['/path'], {
            queryParams: { locked: labId },
          });
        }
      });
    });
  }

  protected async submitCommand(command: string): Promise<void> {
    if (this.busy() || this.engine.completed()) {
      return;
    }

    this.busy.set(true);
    try {
      const result = await this.engine.submit(command);
      this.lastResult.set(result);
      if (result?.correct) {
        this.hintVisible.set(false);
      }
    } finally {
      this.busy.set(false);
    }
  }

  protected onSandboxCwd(cwd: string): void {
    this.dockerSession.setCwd(cwd);
  }

  protected onSandboxLiveState(state: SandboxLiveState): void {
    this.dockerSession.setLiveState(state);
  }

  protected async checkWork(): Promise<void> {
    if (!this.usesDocker() || this.busy()) {
      return;
    }

    this.busy.set(true);
    try {
      const result = await this.dockerSession.checkWork();
      this.dockerChecked.set(true);
      this.checkMessage.set(result ? this.feedbackForCheck(result) : null);
    } finally {
      this.busy.set(false);
    }
  }

  protected toggleHint(): void {
    this.hintVisible.update((visible) => !visible);
  }

  protected async reset(): Promise<void> {
    if (this.usesDocker()) {
      this.busy.set(true);
      try {
        await this.dockerSession.reset(this.lab().id);
        this.checkMessage.set(null);
        this.dockerChecked.set(false);
      } finally {
        this.busy.set(false);
      }
      return;
    }

    this.engine.reset();
    this.progress.resetLab(this.lab().id);
    this.hintVisible.set(false);
    this.lastResult.set(null);
  }

  protected fileName(file: LabFile | null): string {
    if (!file) {
      return 'workspace';
    }
    return file.path.split('/').pop() ?? file.path;
  }

  protected async completeLab(): Promise<void> {
    if (!this.labCompleted()) {
      return;
    }

    const lab = this.lab();
    await this.progress.complete(lab);

    if (lab.id === 'lab-05' && this.progress.allLabsCompleted()) {
      void this.router.navigate(['/certificate']);
      return;
    }

    void this.router.navigate(['/complete']);
  }

  private feedbackForCheck(result: SandboxCheckResult): string {
    if (result.completed) {
      return result.message;
    }
    return result.message;
  }
}

function splitPermissions(permissions = '---------'): [string, string, string] {
  const normalized = permissions.slice(-9).padStart(9, '-');
  return [
    normalized.slice(0, 3),
    normalized.slice(3, 6),
    normalized.slice(6, 9),
  ];
}
