import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { certificateGuard } from './core/progress/certificate.guard';
import { labUnlockGuard } from './core/progress/lab-unlock.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
    title: 'ShellCraft - Interactive Linux Lab',
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
    title: 'ShellCraft - Sign In',
  },
  {
    path: 'path',
    loadComponent: () => import('./pages/path/path.page').then((m) => m.PathPage),
    title: 'ShellCraft - Learning Path',
  },
  {
    path: 'lab/:id',
    canActivate: [authGuard, labUnlockGuard],
    loadComponent: () => import('./pages/lab/lab.page').then((m) => m.LabPage),
    title: 'ShellCraft - Lab',
  },
  {
    path: 'complete',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/complete/complete.page').then((m) => m.CompletePage),
    title: 'ShellCraft - Lab Completed',
  },
  {
    path: 'certificate',
    canActivate: [authGuard, certificateGuard],
    loadComponent: () => import('./pages/certificate/certificate.page').then((m) => m.CertificatePage),
    title: 'ShellCraft - Mission Complete',
  },
  {
    path: 'verify',
    loadComponent: () => import('./pages/verify/verify.page').then((m) => m.VerifyPage),
    title: 'ShellCraft - Verify Certificate',
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
    title: 'ShellCraft - Settings',
  },
  { path: '**', redirectTo: '' },
];
