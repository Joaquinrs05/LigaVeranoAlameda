import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { FantasyService } from '../../../core/services/fantasy.service';
import { IJugadorFantasy } from '../../../core/models/fantasy.model';

interface Slot { jugador: IJugadorFantasy | null; posicion: IJugadorFantasy['posicion'] }

@Component({
  selector: 'app-mi-equipo',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink, DecimalPipe, PlayerCardComponent],
  templateUrl: './mi-equipo.component.html',
})
export class MiEquipoComponent implements OnInit {
  private readonly fantasy = inject(FantasyService);

  readonly seleccionado  = signal<string | null>(null);
  readonly slotPendiente = signal<IJugadorFantasy['posicion'] | null>(null);
  readonly errorSlot     = signal<string | null>(null);

  readonly jugadores = computed<IJugadorFantasy[]>(() => this.fantasy.miEquipo());

  readonly titulares       = computed(() => this.jugadores().filter(j => j.titular));
  readonly reservas        = computed(() => this.jugadores().filter(j => !j.titular));
  readonly slotsPortero         = computed(() => this.buildSlots('portero',        1));
  readonly slotsDefensas        = computed(() => this.buildSlots('defensa',        2));
  readonly slotsCentrocampistas = computed(() => this.buildSlots('centrocampista', 2));
  readonly slotsDelanteros      = computed(() => this.buildSlots('delantero',      2));

  readonly valorTotal = computed(() =>
    this.jugadores().reduce((sum, j) => sum + j.precio, 0)
  );

  readonly miembro = this.fantasy.miembro;

  get equipo(): { nombre: string; propietario: string; puntuacionJornada: number; presupuesto: number } {
    const m = this.fantasy.miembro();
    return {
      nombre:            m?.nombre_equipo ?? 'Mi Equipo',
      propietario:       m?.nombre_equipo ?? '',
      puntuacionJornada: 0,
      presupuesto:       m?.presupuesto   ?? 100,
    };
  }

  ngOnInit(): void {
    if (!this.fantasy.enLiga()) {
      this.fantasy.inicializar();
    } else {
      this.fantasy.refrescarMiEquipo();
    }
  }

  seleccionar(id: string): void {
    const pendiente = this.slotPendiente();
    if (pendiente) {
      const j = this.jugadores().find(p => p.id === id);
      if (j && !j.titular) {
        if (j.posicion !== pendiente) {
          this._mostrarError(`${j.nombre.split(' ')[0]} es ${this.posicionAbrev(j.posicion)}, no puede jugar de ${this.posicionAbrev(pendiente)}`);
          return;
        }
        this._promoverATitular(id);
        return;
      }
      this.slotPendiente.set(null);
    }

    const actual = this.seleccionado();
    if (!actual) { this.seleccionado.set(id); return; }
    if (actual === id) { this.seleccionado.set(null); return; }

    const jActual = this.jugadores().find(j => j.id === actual)!;
    const jTarget = this.jugadores().find(j => j.id === id)!;

    // Si ambos tienen el mismo estado (titular+titular o reserva+reserva) no hay nada que intercambiar
    if (jActual.titular === jTarget.titular) { this.seleccionado.set(null); return; }

    // No se puede intercambiar jugadores de distinta posición
    if (jActual.posicion !== jTarget.posicion) {
      this._mostrarError(
        `${jActual.nombre.split(' ')[0]} es ${this.posicionAbrev(jActual.posicion)}, no puede cambiar con ${jTarget.nombre.split(' ')[0]} (${this.posicionAbrev(jTarget.posicion)})`
      );
      return;
    }

    const updated = this.jugadores().map(j => {
      if (j.id === actual) return { ...j, titular: jTarget.titular };
      if (j.id === id)     return { ...j, titular: jActual.titular };
      return j;
    });
    this.fantasy.miEquipo.set(updated);
    this.seleccionado.set(null);
    this.fantasy.actualizarPlantilla(
      updated.map(j => ({ jugador_id: j.id, es_titular: j.titular, es_capitan: false }))
    );
  }

  seleccionarSlot(posicion: IJugadorFantasy['posicion']): void {
    const id = this.seleccionado();
    if (id) {
      const j = this.jugadores().find(p => p.id === id);
      if (j && j.posicion !== posicion) {
        this._mostrarError(`${j.nombre.split(' ')[0]} es ${this.posicionAbrev(j.posicion)}, no puede jugar de ${this.posicionAbrev(posicion)}`);
        return;
      }
      this._promoverATitular(id);
      return;
    }
    this.slotPendiente.set(posicion);
  }

  cancelar(): void {
    this.seleccionado.set(null);
    this.slotPendiente.set(null);
    this.errorSlot.set(null);
  }

  private _promoverATitular(id: string): void {
    const j = this.jugadores().find(p => p.id === id);
    if (!j || j.titular) return;
    const updated = this.jugadores().map(p =>
      p.id === id ? { ...p, titular: true } : p
    );
    this.fantasy.miEquipo.set(updated);
    this.seleccionado.set(null);
    this.slotPendiente.set(null);
    this.fantasy.actualizarPlantilla(
      updated.map(p => ({ jugador_id: p.id, es_titular: p.titular, es_capitan: false }))
    );
  }

  private _mostrarError(msg: string): void {
    this.errorSlot.set(msg);
    setTimeout(() => this.errorSlot.set(null), 2500);
  }

  private buildSlots(posicion: IJugadorFantasy['posicion'], max: number): Slot[] {
    const found = this.titulares().filter(j => j.posicion === posicion);
    return Array.from({ length: max }, (_, i) => ({ jugador: found[i] ?? null, posicion }));
  }

  primerNombre(nombre: string): string { return nombre.split(' ')[0]; }
  iniciales(nombre: string): string    { return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase(); }
  equipoAbrev(equipo: string): string  { return equipo.split(' ').map(p => p[0]).join('').slice(0, 3).toUpperCase(); }

  posicionColor(pos: IJugadorFantasy['posicion']): string {
    return { portero: '#1a4a2e', defensa: '#c0552a', centrocampista: '#0f5a8a', delantero: '#7b2d8b' }[pos];
  }

  posicionAbrev(pos: IJugadorFantasy['posicion']): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }
}
