import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { LabProgress } from './core/progress/lab-progress';
import { EXECUTION_BACKEND } from './core/execution/execution-backend';
import { SimulatedBackend } from './core/execution/simulated-backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(async () => {
      const auth = inject(AuthService);
      const progress = inject(LabProgress);
      await auth.restoreSession();
      await progress.ensureLoaded();
    }),
    { provide: EXECUTION_BACKEND, useExisting: SimulatedBackend },
  ],
};
