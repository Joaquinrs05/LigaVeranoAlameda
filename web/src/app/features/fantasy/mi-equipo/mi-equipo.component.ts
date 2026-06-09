import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { FantasyService } from '../../../core/services/fantasy.service';
import { IJugadorFantasy } from '../../../core/models/fantasy.model';

interface Slot { jugador: IJugadorFantasy | null; posicion: IJugadorFantasy['posicion'] }

type Formacion = '1-2-2-2' | '1-3-2-1' | '1-2-3-1' | '1-3-1-2' | '1-1-3-2';

const FORMACIONES: Record<Formacion, { portero: number; defensa: number; centrocampista: number; delantero: number }> = {
  '1-2-2-2': { portero: 1, defensa: 2, centrocampista: 2, delantero: 2 },
  '1-3-2-1': { portero: 1, defensa: 3, centrocampista: 2, delantero: 1 },
  '1-2-3-1': { portero: 1, defensa: 2, centrocampista: 3, delantero: 1 },
  '1-3-1-2': { portero: 1, defensa: 3, centrocampista: 1, delantero: 2 },
  '1-1-3-2': { portero: 1, defensa: 1, centrocampista: 3, delantero: 2 },
};

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
  readonly formacion     = signal<Formacion>((localStorage.getItem('formacion') as Formacion) ?? '1-2-2-2');
  readonly movidos       = signal<string[]>([]);

  readonly formaciones: Formacion[] = Object.keys(FORMACIONES) as Formacion[];

  readonly jugadores = computed<IJugadorFantasy[]>(() => this.fantasy.miEquipo());

  readonly titulares            = computed(() => this.jugadores().filter(j => j.titular));
  readonly reservas             = computed(() => this.jugadores().filter(j => !j.titular));
  readonly slotsPortero         = computed(() => this.buildSlots('portero',        FORMACIONES[this.formacion()].portero));
  readonly slotsDefensas        = computed(() => this.buildSlots('defensa',        FORMACIONES[this.formacion()].defensa));
  readonly slotsCentrocampistas = computed(() => this.buildSlots('centrocampista', FORMACIONES[this.formacion()].centrocampista));
  readonly slotsDelanteros      = computed(() => this.buildSlots('delantero',      FORMACIONES[this.formacion()].delantero));

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

  cambiarFormacion(f: Formacion): void {
    if (f === this.formacion()) return;
    const config = FORMACIONES[f];
    const posiciones: Array<IJugadorFantasy['posicion']> = ['portero', 'defensa', 'centrocampista', 'delantero'];
    let updated = [...this.jugadores()];
    const idsSobrantes: string[] = [];

    for (const pos of posiciones) {
      const max = config[pos];
      const titularesPos = updated.filter(j => j.titular && j.posicion === pos);
      if (titularesPos.length > max) {
        const sobrantes = titularesPos.slice(max);
        sobrantes.forEach(s => idsSobrantes.push(s.id));
        updated = updated.map(j =>
          sobrantes.some(s => s.id === j.id) ? { ...j, titular: false } : j
        );
      }
    }

    this.fantasy.miEquipo.set(updated);
    this.formacion.set(f);
    localStorage.setItem('formacion', f);

    if (idsSobrantes.length > 0) {
      this.movidos.set(idsSobrantes);
      setTimeout(() => this.movidos.set([]), 3000);
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

    if (jActual.titular === jTarget.titular) { this.seleccionado.set(null); return; }

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

    const config = FORMACIONES[this.formacion()];
    const titularesEnPos = this.titulares().filter(t => t.posicion === j.posicion).length;
    if (titularesEnPos >= config[j.posicion]) {
      this._mostrarError(`Ya tienes el máximo de ${this.posicionAbrev(j.posicion)} en la formación ${this.formacion()}`);
      return;
    }

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
