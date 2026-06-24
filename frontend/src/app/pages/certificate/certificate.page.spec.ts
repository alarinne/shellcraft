import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE, createMemoryAuthStorage } from '../../core/auth/auth-storage';
import { CertificatePage } from './certificate.page';

const cert = {
  id: 'cert-1',
  holderName: 'Ada Lovelace',
  issuedAt: '2026-06-24T12:00:00Z',
  labsCompleted: 5,
  signature: 'a'.repeat(64),
  verificationUrl: 'http://localhost:4200/verify?c=cert-1&s=abc',
};

describe('CertificatePage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders mission complete content when a certificate is loaded', () => {
    TestBed.configureTestingModule({
      imports: [CertificatePage],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORAGE, useFactory: createMemoryAuthStorage },
      ],
    });

    const fixture = TestBed.createComponent(CertificatePage);
    const page = fixture.componentInstance as CertificatePage & {
      certificate: { set(value: typeof cert | null): void };
      loading: { set(value: boolean): void };
    };
    page.certificate.set(cert);
    page.loading.set(false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Mission Complete');
    expect(element.textContent).toContain('Ada Lovelace');
  });
});
