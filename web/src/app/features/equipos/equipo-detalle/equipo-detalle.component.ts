import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { EQUIPOS_DATA } from '../../../core/data/equipos.data';
import { IEquipo, IJugadorEquipo } from '../../../core/models/equipo.model';

@Component({
  selector: 'app-equipo-detalle',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink, PlayerCardComponent],
  templateUrl: './equipo-detalle.component.html',
})
export class EquipoDetalleComponent {
  private readonly route = inject(ActivatedRoute);

  readonly equipo: IEquipo | undefined = (() => {
    const id = this.route.snapshot.paramMap.get('id');
    return EQUIPOS_DATA.find(e => e.id === id);
  })();

  readonly porteros        = this.equipo?.jugadores.filter(j => j.posicion === 'POR') ?? [];
  readonly defensas        = this.equipo?.jugadores.filter(j => j.posicion === 'DEF') ?? [];
  readonly centrocampistas = this.equipo?.jugadores.filter(j => j.posicion === 'MC')  ?? [];
  readonly delanteros      = this.equipo?.jugadores.filter(j => j.posicion === 'DEL') ?? [];

  primerNombre(nombre: string): string {
    return nombre.split(' ')[0];
  }
}
