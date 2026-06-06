import { Component, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { MI_EQUIPO_FANTASY } from '../../../core/data/fantasy.data';
import { IJugadorFantasy } from '../../../core/models/fantasy.model';

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink, DecimalPipe, PlayerCardComponent],
  templateUrl: './mi-equipo.component.html',
})
export class MiEquipoComponent {
  readonly equipo = MI_EQUIPO_FANTASY;

  jugadores = signal<IJugadorFantasy[]>([...MI_EQUIPO_FANTASY.jugadores]);

  readonly titulares      = computed(() => this.jugadores().filter(j => j.titular));
  readonly reservas       = computed(() => this.jugadores().filter(j => !j.titular));
  readonly portero        = computed(() => this.titulares().filter(j => j.posicion === 'portero'));
  readonly defensas       = computed(() => this.titulares().filter(j => j.posicion === 'defensa'));
  readonly centrocampistas= computed(() => this.titulares().filter(j => j.posicion === 'centrocampista'));
  readonly delanteros     = computed(() => this.titulares().filter(j => j.posicion === 'delantero'));

  readonly valorTotal = computed(() =>
    this.jugadores().reduce((sum, j) => sum + j.precio, 0)
  );

  readonly seleccionado = signal<string | null>(null);

  seleccionar(id: string): void {
    const actual = this.seleccionado();

    if (!actual) {
      this.seleccionado.set(id);
      return;
    }

    if (actual === id) {
      this.seleccionado.set(null);
      return;
    }

    // Intercambiar titularidad
    this.jugadores.update(lista =>
      lista.map(j => {
        if (j.id === actual) return { ...j, titular: !j.titular };
        if (j.id === id)     return { ...j, titular: !j.titular };
        return j;
      })
    );
    this.seleccionado.set(null);
  }

  primerNombre(nombre: string): string {
    return nombre.split(' ')[0];
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  equipoAbrev(equipo: string): string {
    return equipo.split(' ').map(p => p[0]).join('').slice(0, 3).toUpperCase();
  }

  posicionColor(pos: IJugadorFantasy['posicion']): string {
    return {
      portero:        '#1a4a2e',
      defensa:        '#c0552a',
      centrocampista: '#0f5a8a',
      delantero:      '#7b2d8b',
    }[pos];
  }

  posicionAbrev(pos: IJugadorFantasy['posicion']): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }
}
