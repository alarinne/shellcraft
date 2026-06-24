import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { EXECUTION_BACKEND } from './core/execution/execution-backend';
import { SimulatedBackend } from './core/execution/simulated-backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Restore the session (GET /api/auth/me) before the first route activates,
    // so auth guards see the correct state.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    // Default execution backend (ADR-0002). Swappable for the Docker sandbox (#9).
    { provide: EXECUTION_BACKEND, useExisting: SimulatedBackend },
  ],
};
