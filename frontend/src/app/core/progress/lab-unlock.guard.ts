import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LabProgress } from './lab-progress';

export const labUnlockGuard: CanActivateFn = async (route) => {
  const progress = inject(LabProgress);
  const router = inject(Router);
  const labId = route.paramMap.get('id');

  if (!labId) {
    return router.createUrlTree(['/path']);
  }

  await progress.ensureLoaded();

  if (progress.isLabUnlocked(labId)) {
    return true;
  }

  return router.createUrlTree(['/path'], {
    queryParams: { locked: labId },
  });
};
