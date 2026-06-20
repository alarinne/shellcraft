import { Component, computed, signal } from '@angular/core';

type ScreenKey = 'landing' | 'path' | 'lab' | 'complete';

interface ScreenNavItem {
  key: ScreenKey;
  label: string;
}

interface LabCard {
  id: string;
  title: string;
  tag: string;
  status: string;
  description: string;
  xp: number;
  accent: 'blue' | 'purple' | 'orange';
  locked: boolean;
  actionLabel: string;
  commands: string[];
}

interface CommandDemo {
  command: string;
  label: string;
  output: string[];
  insight: string;
  visualSteps: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.shellcraft.html',
  styleUrl: './app-shellcraft.scss',
})
export class App {
  protected readonly screens: ScreenNavItem[] = [
    { key: 'landing', label: 'Landing' },
    { key: 'path', label: 'Learning Path' },
    { key: 'lab', label: 'Lab Screen' },
    { key: 'complete', label: 'Completed' },
  ];

  protected readonly stats = [
    { label: 'Labs', value: '03' },
    { label: 'XP', value: '270' },
    { label: 'Streak', value: '04' },
  ];

  protected readonly labs: LabCard[] = [
    {
      id: 'lab-01',
      title: 'Terminal & Filesystem',
      tag: 'Lab 01',
      status: 'Ready',
      description: 'Master pwd, ls, cd, and visual directory context.',
      xp: 120,
      accent: 'blue',
      locked: false,
      actionLabel: 'Review',
      commands: ['pwd', 'ls -la', 'cd'],
    },
    {
      id: 'lab-02',
      title: 'Permissions',
      tag: 'Lab 02',
      status: 'Current',
      description: 'Learn chmod, ownership, and the rwx permission model.',
      xp: 150,
      accent: 'purple',
      locked: false,
      actionLabel: 'Start lab',
      commands: ['chmod', 'stat', 'ls -l'],
    },
    {
      id: 'lab-03',
      title: 'Pipes & Grep',
      tag: 'Lab 03',
      status: 'Locked',
      description: 'Filter logs and connect commands through streams.',
      xp: 180,
      accent: 'orange',
      locked: true,
      actionLabel: 'Locked',
      commands: ['cat', 'grep', 'wc'],
    },
  ];

  protected readonly commandDemos: CommandDemo[] = [
    {
      command: 'pwd',
      label: 'Locate current path',
      output: ['/home/guest/projects'],
      insight: 'pwd prints the working directory before you move through the filesystem.',
      visualSteps: ['home', 'guest', 'projects'],
    },
    {
      command: 'ls -la',
      label: 'Inspect directory',
      output: [
        'drwxr-xr-x 2 guest guest 4096 labs',
        '-rw-r--r-- 1 guest guest  248 README.md',
        '-rwxr-xr-x 1 guest guest  913 deploy.sh',
      ],
      insight: 'Long listing shows permissions, owner, group, size, and file names.',
      visualSteps: ['type', 'permissions', 'owner', 'name'],
    },
    {
      command: 'chmod 755 deploy.sh',
      label: 'Shift permissions',
      output: ['mode changed: deploy.sh -> rwxr-xr-x'],
      insight: 'Owner keeps write access while group and others can read and execute.',
      visualSteps: ['owner rwx', 'group r-x', 'others r-x'],
    },
  ];

  protected readonly learnedCommands = ['ls -la', 'chmod', 'stat', 'cd'];
  protected readonly permissionRows = [
    { role: 'Owner', value: 'rwx', tone: 'blue' },
    { role: 'Group', value: 'r-x', tone: 'purple' },
    { role: 'Others', value: 'r-x', tone: 'orange' },
  ];

  protected readonly selectedScreen = signal<ScreenKey>('landing');
  protected readonly selectedDemo = signal<CommandDemo>(this.commandDemos[1]);
  protected readonly currentLab = signal<LabCard>(this.labs[1]);

  protected readonly promptLine = computed(
    () => `guest@shellcraft:~$ ${this.selectedDemo().command}`,
  );

  protected readonly screenTitle = computed(
    () => this.screens.find((screen) => screen.key === this.selectedScreen())?.label ?? 'Landing',
  );

  protected selectScreen(screen: ScreenKey): void {
    this.selectedScreen.set(screen);
  }

  protected selectDemo(demo: CommandDemo): void {
    this.selectedDemo.set(demo);
  }

  protected startLab(lab = this.currentLab()): void {
    if (lab.locked) {
      return;
    }

    this.currentLab.set(lab);
    this.selectedScreen.set('lab');
  }

  protected completeLab(): void {
    this.selectedScreen.set('complete');
  }
}
