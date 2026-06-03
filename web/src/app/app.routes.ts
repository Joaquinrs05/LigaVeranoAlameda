import { Routes } from '@angular/router';

export const routes: Routes = [
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
  {
    path: 'fantasy',
    redirectTo: 'fantasy/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'fantasy/dashboard',
    loadComponent: () => import('./features/fantasy/dashboard/fantasy-dashboard.component').then(m => m.FantasyDashboardComponent),
  },
  {
    path: 'fantasy/mercado',
    loadComponent: () => import('./features/fantasy/mercado/mercado.component').then(m => m.MercadoComponent),
  },
  {
    path: 'fantasy/mi-equipo',
    loadComponent: () => import('./features/fantasy/mi-equipo/mi-equipo.component').then(m => m.MiEquipoComponent),
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
