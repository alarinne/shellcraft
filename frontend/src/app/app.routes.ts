import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
    title: 'ShellCraft — Interactive Linux Lab',
  },
  {
    path: 'path',
    loadComponent: () => import('./pages/path/path.page').then((m) => m.PathPage),
    title: 'ShellCraft — Learning Path',
  },
  {
    path: 'lab/:id',
    loadComponent: () => import('./pages/lab/lab.page').then((m) => m.LabPage),
    title: 'ShellCraft — Lab',
  },
  {
    path: 'complete',
    loadComponent: () => import('./pages/complete/complete.page').then((m) => m.CompletePage),
    title: 'ShellCraft — Lab Completed',
  },
  { path: '**', redirectTo: '' },
];
