import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { EquipoAdminPlantillaComponent } from './components/plantilla/equipo-admin-plantilla.component';
import { EquipoAdminAlineacionComponent } from './components/alineacion/equipo-admin-alineacion.component';
import { EquipoAdminEquipoComponent } from './components/equipo/equipo-admin-equipo.component';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { IEntrenadorEquipo } from '../../core/models/equipo-admin.model';

type CoachTab = 'plantilla' | 'alineacion' | 'equipo';

const TABS: { id: CoachTab; label: string; icon: string }[] = [
  { id: 'plantilla',  label: 'Plantilla',  icon: 'group' },
  { id: 'alineacion', label: 'Alineación', icon: 'sports_soccer' },
  { id: 'equipo',     label: 'Equipo',     icon: 'shield' },
];

@Component({
  selector: 'app-equipo-admin',
  standalone: true,
  templateUrl: './equipo-admin.component.html',
  imports: [NavbarLightComponent, EquipoAdminPlantillaComponent, EquipoAdminAlineacionComponent, EquipoAdminEquipoComponent],
})
export class EquipoAdminComponent implements OnInit {
  private readonly svc = inject(EntrenadorService);
  private readonly route = inject(ActivatedRoute);

  readonly tabs = TABS;
  readonly tabActiva = signal<CoachTab>('plantilla');
  readonly equipo = signal<IEntrenadorEquipo | null>(null);
  readonly equipoId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.equipoId.set(id);
    const obs = id ? this.svc.getEquipoById(id) : this.svc.getMiEquipo();
    obs.subscribe({ next: e => this.equipo.set(e) });
  }

  setTab(tab: CoachTab): void {
    this.tabActiva.set(tab);
  }
}
