import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rutas públicas
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'clasificacion',
    loadComponent: () => import('./features/clasificacion/clasificacion.component').then(m => m.ClasificacionComponent),
  },
  {
    path: 'equipos',
    loadComponent: () => import('./features/equipos/equipos.component').then(m => m.EquiposComponent),
  },
  {
    path: 'equipos/:id',
    loadComponent: () => import('./features/equipos/equipo-detalle/equipo-detalle.component').then(m => m.EquipoDetalleComponent),
  },

  // Autenticación
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'callback',
        loadComponent: () => import('./features/auth/callback/auth-callback.component').then(m => m.AuthCallbackComponent),
      },
    ],
  },

  // Rutas protegidas
  {
    path: 'fantasy',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/fantasy/dashboard/fantasy-dashboard.component').then(m => m.FantasyDashboardComponent),
      },
      {
        path: 'mercado',
        loadComponent: () => import('./features/fantasy/mercado/mercado.component').then(m => m.MercadoComponent),
      },
      {
        path: 'mi-equipo',
        loadComponent: () => import('./features/fantasy/mi-equipo/mi-equipo.component').then(m => m.MiEquipoComponent),
      },
    ],
  },

  {
    path: 'ajustes',
    loadComponent: () => import('./features/ajustes/ajustes.component').then(m => m.AjustesComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
