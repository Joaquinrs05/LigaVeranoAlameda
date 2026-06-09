import { Component, signal } from '@angular/core';
import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { SuperadminJornadasComponent } from './components/jornadas/superadmin-jornadas.component';
import { SuperadminResultadosComponent } from './components/resultados/superadmin-resultados.component';
import { SuperadminJugadoresComponent } from './components/jugadores/superadmin-jugadores.component';
import { SuperadminEquiposComponent } from './components/equipos/superadmin-equipos.component';
import { SuperadminPuntuacionesComponent } from './components/puntuaciones/superadmin-puntuaciones.component';
import { SuperadminParticipantesComponent } from './components/participantes/superadmin-participantes.component';

type AdminTab = 'jornadas' | 'resultados' | 'jugadores' | 'equipos' | 'puntuaciones' | 'participantes';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'jornadas',      label: 'Jornadas' },
  { id: 'resultados',    label: 'Resultados' },
  { id: 'jugadores',     label: 'Jugadores' },
  { id: 'equipos',       label: 'Equipos' },
  { id: 'puntuaciones',  label: 'Puntuaciones' },
  { id: 'participantes', label: 'Participantes' },
];

@Component({
  selector: 'app-superadmin',
  standalone: true,
  templateUrl: './superadmin.component.html',
  imports: [
    NavbarLightComponent,
    SuperadminJornadasComponent,
    SuperadminResultadosComponent,
    SuperadminJugadoresComponent,
    SuperadminEquiposComponent,
    SuperadminPuntuacionesComponent,
    SuperadminParticipantesComponent,
  ],
})
export class SuperadminComponent {
  readonly tabs = TABS;
  readonly tabActiva = signal<AdminTab>('jornadas');

  setTab(tab: AdminTab): void {
    this.tabActiva.set(tab);
  }
}
