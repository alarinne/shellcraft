import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { apiFetch } from '../../core/api/http';

interface VerifyResult {
  valid: boolean;
  holderName?: string;
  issuedAt?: string;
  labsCompleted?: number;
}

@Component({
  selector: 'sc-verify-page',
  templateUrl: './verify.page.html',
})
export class VerifyPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly result = signal<VerifyResult | null>(null);
  protected readonly missingParams = signal(false);

  async ngOnInit(): Promise<void> {
    const certId = this.route.snapshot.queryParamMap.get('c');
    const signature = this.route.snapshot.queryParamMap.get('s');

    if (!certId || !signature) {
      this.missingParams.set(true);
      this.loading.set(false);
      return;
    }

    const response = await apiFetch<VerifyResult>(
      `/api/certificates/verify?c=${encodeURIComponent(certId)}&s=${encodeURIComponent(signature)}`,
    );

    if (response.ok && response.data) {
      this.result.set(response.data);
    } else {
      this.result.set({ valid: false });
    }

    this.loading.set(false);
  }

  protected formatDate(iso: string | undefined): string {
    if (!iso) {
      return '';
    }
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
