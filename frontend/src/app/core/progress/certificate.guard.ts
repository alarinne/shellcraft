import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LabProgress } from './lab-progress';

export const certificateGuard: CanActivateFn = async () => {
  const progress = inject(LabProgress);
  const router = inject(Router);

  await progress.ensureLoaded();

  if (progress.allLabsCompleted()) {
    return true;
  }

  return router.createUrlTree(['/path']);
};
