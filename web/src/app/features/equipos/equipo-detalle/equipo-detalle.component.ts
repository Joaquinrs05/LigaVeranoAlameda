import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { EQUIPOS_DATA } from '../../../core/data/equipos.data';
import { IEquipo, IJugadorEquipo } from '../../../core/models/equipo.model';

interface IJugadorPosicionado extends IJugadorEquipo {
  x: number; // % from left of pitch container
  y: number; // % from top of pitch container
}

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

  readonly jugadoresEnCampo: IJugadorPosicionado[] = (() => {
    const jugadores = this.equipo?.jugadores ?? [];

    const result: IJugadorPosicionado[] = [];

    // Distribuye N jugadores equitativamente entre yMin e yMax en la columna x
    const placeColumn = (players: IJugadorEquipo[], x: number, yMin: number, yMax: number) => {
      const n = players.length;
      players.forEach((j, i) => {
        const y = n === 1 ? (yMin + yMax) / 2 : yMin + (yMax - yMin) * (i / (n - 1));
        result.push({ ...j, x, y });
      });
    };

    const pors = jugadores.filter(j => j.posicion === 'POR');
    const defs = jugadores.filter(j => j.posicion === 'DEF');
    const mcs  = jugadores.filter(j => j.posicion === 'MC');
    const dels = jugadores.filter(j => j.posicion === 'DEL');

    placeColumn(pors, 11, 50, 50);  // portero siempre centrado
    placeColumn(defs, 29, 20, 80);
    placeColumn(mcs,  60, 18, 82);
    placeColumn(dels, 81, 20, 80);

    return result;
  })();

  primerNombre(nombre: string): string {
    return nombre.split(' ')[0];
  }

  posicionAbrev(posicion: IJugadorEquipo['posicion']): string {
    return posicion;
  }
}
