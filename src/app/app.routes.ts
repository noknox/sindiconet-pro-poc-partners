import { Routes } from '@angular/router';
import { sindiconetIaGuard } from './features/sindiconet-ia/sindiconet-ia.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'organizations'
  },
  {
    path: 'sindiconet-ia',
    canActivate: [sindiconetIaGuard],
    loadComponent: () =>
      import('./features/sindiconet-ia/sindiconet-ia.page').then((m) => m.SindiconetIaPage)
  },
  {
    path: 'auth-error',
    loadComponent: () =>
      import('./features/sindiconet-ia/auth-error.page').then((m) => m.AuthErrorPage)
  },
  {
    path: 'organizations',
    loadComponent: () =>
      import('./features/organizations/organizations.page').then((m) => m.OrganizationsPage)
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/users/users.page').then((m) => m.UsersPage)
  },
  {
    path: 'condominiums',
    loadComponent: () =>
      import('./features/condominiums/condominiums.page').then((m) => m.CondominiumsPage)
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./features/documents/documents.page').then((m) => m.DocumentsPage)
  },
  { path: '**', redirectTo: 'organizations' }
];