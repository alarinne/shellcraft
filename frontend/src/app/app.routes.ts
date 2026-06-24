import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
    canActivate: [authGuard],
    loadComponent: () => import('./pages/lab/lab.page').then((m) => m.LabPage),
    title: 'ShellCraft - Lab',
  },
  {
    path: 'complete',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/complete/complete.page').then((m) => m.CompletePage),
    title: 'ShellCraft - Lab Completed',
  },
  { path: '**', redirectTo: '' },
];
