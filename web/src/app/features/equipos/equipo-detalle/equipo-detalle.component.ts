import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { LigaRealService } from '../../../core/services/liga-real.service';

@Component({
  selector: 'app-equipo-detalle',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink, PlayerCardComponent],
  templateUrl: './equipo-detalle.component.html',
})
export class EquipoDetalleComponent {
  private readonly liga = inject(LigaRealService);

  readonly equipo = this.liga.equipoDetalle;

  readonly porteros        = computed(() => this.equipo()?.jugadores.filter(j => j.posicion === 'POR') ?? []);
  readonly defensas        = computed(() => this.equipo()?.jugadores.filter(j => j.posicion === 'DEF') ?? []);
  readonly centrocampistas = computed(() => this.equipo()?.jugadores.filter(j => j.posicion === 'MC')  ?? []);
  readonly delanteros      = computed(() => this.equipo()?.jugadores.filter(j => j.posicion === 'DEL') ?? []);

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
    this.liga.cargarEquipoDetalle(id);
  }
}
