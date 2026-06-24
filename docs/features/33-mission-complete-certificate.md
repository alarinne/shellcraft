# Feature: Mission complete certificate and lab route protection

- **Issue:** (branch feature)
- **PR:** TBD
- **Status:** Shipped
- **Area:** frontend | backend

## Why

ShellCraft needs a satisfying finale after Lab 05, a verifiable completion
certificate for gamification and proof of mastery, and enforced progressive
unlocking so learners cannot skip ahead by pasting lab URLs.

## What changed

- **Progressive lab gating** — frontend `labUnlockGuard` on `/lab/:id` plus
  backend `403` when completing a lab before its prerequisite.
- **Mission complete screen** — after Lab 05, learners land on `/certificate`
  with congratulations, badge summary, and a downloadable certificate.
- **HMAC-signed certificates** — Postgres `certificates` table; issued when all
  five labs are complete; QR encodes a public verification URL.
- **Public verification** — `/verify?c=&s=` page and `GET /api/certificates/verify`.
- **Learning path UX** — locked-lab banner and “View certificate” CTA when done.

## How it works

1. `LabProgress.ensureLoaded()` hydrates progress at app boot (with auth restore).
2. `labUnlockGuard` checks `isLabUnlocked(labId)`; locked labs redirect to
   `/path?locked=<id>`.
3. `POST /api/progress/{labId}/complete` calls `assert_lab_unlocked` before XP.
4. When all labs are done, `certificate_service.issue_certificate_if_eligible`
   creates a row and HMAC signature (`certificate_signing.py`).
5. Certificate page fetches `GET /api/certificates/me`, renders QR via `qrcode`,
   and supports PNG download via canvas.

## Testing

```bash
cd backend && pytest -q tests/test_progress_gating.py tests/test_certificates.py
cd frontend && npx ng test --watch=false
```

## Follow-ups

- Require auth on sandbox session creation with the same unlock check.
- PDF export and shareable social image variants.
