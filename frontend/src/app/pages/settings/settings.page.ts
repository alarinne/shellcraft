import { Component, effect, inject, signal } from '@angular/core';
import { SettingsService } from '../../core/settings/settings.service';

type SaveStatus = 'idle' | 'saved' | 'error';

@Component({
  selector: 'sc-settings-page',
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  private readonly settingsService = inject(SettingsService);

  protected readonly theme = signal('dark');
  protected readonly terminalFontSize = signal(14);
  protected readonly soundEnabled = signal(true);
  protected readonly reducedMotion = signal(false);

  protected readonly saving = signal(false);
  protected readonly status = signal<SaveStatus>('idle');

  protected readonly themes = ['dark', 'light'];

  constructor() {
    // Seed the form from the loaded settings (updates when they arrive).
    effect(() => {
      const current = this.settingsService.settings();
      this.theme.set(current.theme);
      this.terminalFontSize.set(current.terminalFontSize);
      this.soundEnabled.set(current.soundEnabled);
      this.reducedMotion.set(current.reducedMotion);
    });
  }

  protected setTheme(value: string): void {
    this.theme.set(value);
    this.status.set('idle');
  }

  protected setFontSize(value: string): void {
    this.terminalFontSize.set(Number(value));
    this.status.set('idle');
  }

  protected setSound(value: boolean): void {
    this.soundEnabled.set(value);
    this.status.set('idle');
  }

  protected setReducedMotion(value: boolean): void {
    this.reducedMotion.set(value);
    this.status.set('idle');
  }

  protected async save(): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      const ok = await this.settingsService.update({
        theme: this.theme(),
        terminalFontSize: this.terminalFontSize(),
        soundEnabled: this.soundEnabled(),
        reducedMotion: this.reducedMotion(),
      });
      this.status.set(ok ? 'saved' : 'error');
    } finally {
      this.saving.set(false);
    }
  }
}
