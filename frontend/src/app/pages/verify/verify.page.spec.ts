import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { installApiMock, settle } from '../../core/testing/api-mock';
import { VerifyPage } from './verify.page';

describe('VerifyPage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a valid certificate result', async () => {
    installApiMock({
      'GET /api/certificates/verify': {
        status: 200,
        body: {
          valid: true,
          holderName: 'Ada Lovelace',
          issuedAt: '2026-06-24T12:00:00Z',
          labsCompleted: 5,
        },
      },
    });

    TestBed.configureTestingModule({
      imports: [VerifyPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ c: 'cert-1', s: 'abc' }),
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(VerifyPage);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    await settle();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Valid certificate');
    expect(element.textContent).toContain('Ada Lovelace');
  });

  it('shows missing params message when query is incomplete', async () => {
    installApiMock({});

    TestBed.configureTestingModule({
      imports: [VerifyPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(VerifyPage);
    fixture.detectChanges();
    await fixture.componentInstance.ngOnInit();
    await settle();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Missing verification data');
  });
});
