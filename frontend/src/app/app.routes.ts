import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
    title: 'ShellCraft — Interactive Linux Lab',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage),
    title: 'ShellCraft — Sign in',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage),
    title: 'ShellCraft — Create account',
  },
  {
    path: 'path',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/path/path.page').then((m) => m.PathPage),
    title: 'ShellCraft — Learning Path',
  },
  {
    path: 'lab/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/lab/lab.page').then((m) => m.LabPage),
    title: 'ShellCraft — Lab',
  },
  {
    path: 'complete',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/complete/complete.page').then((m) => m.CompletePage),
    title: 'ShellCraft — Lab Completed',
  },
  {
    path: 'signals',
    loadComponent: () => import('./pages/signals/signals.page').then((m) => m.SignalsPage),
    title: 'ShellCraft — Signals',
  },
  {
    path: 'pipes',
    loadComponent: () => import('./pages/pipes/pipes.page').then((m) => m.PipesPage),
    title: 'ShellCraft — Pipes & grep',
  },
  { path: '**', redirectTo: '' },
];
