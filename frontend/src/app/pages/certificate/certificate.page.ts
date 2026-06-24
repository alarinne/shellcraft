import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { downloadCertificatePng, qrDataUrl } from '../../core/certificate/certificate-export';
import { CertificateData, LabProgress } from '../../core/progress/lab-progress';
import { LABS } from '../../core/shellcraft-data';

type BadgeIcon = 'shield' | 'medal' | 'pipeline' | 'process' | 'signal';

interface MissionBadge {
  labId: string;
  label: string;
  icon: BadgeIcon;
}

const BADGE_LABELS: Record<string, { label: string; icon: BadgeIcon }> = {
  'lab-01': { label: 'Mission Finder', icon: 'shield' },
  'lab-02': { label: 'Permission Keeper', icon: 'medal' },
  'lab-03': { label: 'Stream Reader', icon: 'pipeline' },
  'lab-04': { label: 'Process Watcher', icon: 'process' },
  'lab-05': { label: 'Signal Handler', icon: 'signal' },
};

@Component({
  selector: 'sc-certificate-page',
  templateUrl: './certificate.page.html',
})
export class CertificatePage implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly progress = inject(LabProgress);

  protected readonly certificate = signal<CertificateData | null>(null);
  protected readonly qrImage = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly downloadBusy = signal(false);

  protected readonly userName = computed(() => this.auth.currentUser()?.name ?? 'Learner');
  protected readonly totalXp = computed(() =>
    LABS.reduce((total, lab) => total + lab.xp, 0),
  );
  protected readonly badges = computed((): readonly MissionBadge[] =>
    LABS.map((lab) => ({
      labId: lab.id,
      label: BADGE_LABELS[lab.id]?.label ?? lab.title,
      icon: BADGE_LABELS[lab.id]?.icon ?? 'shield',
    })),
  );

  async ngOnInit(): Promise<void> {
    const cert = await this.progress.fetchCertificate();
    this.certificate.set(cert);
    this.loading.set(false);

    if (cert?.verificationUrl) {
      const dataUrl = await qrDataUrl(cert.verificationUrl);
      this.qrImage.set(dataUrl);
    }
  }

  protected async downloadPng(): Promise<void> {
    const cert = this.certificate();
    if (!cert) {
      return;
    }

    this.downloadBusy.set(true);
    try {
      await downloadCertificatePng({
        holderName: cert.holderName,
        issuedAt: cert.issuedAt,
        verificationUrl: cert.verificationUrl,
        totalXp: this.totalXp(),
      });
    } finally {
      this.downloadBusy.set(false);
    }
  }

  protected backToPath(): void {
    void this.router.navigate(['/path']);
  }

  protected reviewLabs(): void {
    void this.router.navigate(['/lab', 'lab-01']);
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
