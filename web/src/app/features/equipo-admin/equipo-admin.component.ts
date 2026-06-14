import { Component, OnInit, inject, signal } from '@angular/core';
import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { EquipoAdminPlantillaComponent } from './components/plantilla/equipo-admin-plantilla.component';
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
  imports: [NavbarLightComponent, EquipoAdminPlantillaComponent],
})
export class EquipoAdminComponent implements OnInit {
  private readonly svc = inject(EntrenadorService);

  readonly tabs = TABS;
  readonly tabActiva = signal<CoachTab>('plantilla');
  readonly equipo = signal<IEntrenadorEquipo | null>(null);

  ngOnInit(): void {
    this.svc.getMiEquipo().subscribe({ next: e => this.equipo.set(e) });
  }

  setTab(tab: CoachTab): void {
    this.tabActiva.set(tab);
  }
}
