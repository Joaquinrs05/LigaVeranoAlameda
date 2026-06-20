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

  readonly seleccionado    = signal<string | null>(null);
  readonly slotPendiente   = signal<IJugadorFantasy['posicion'] | null>(null);
  readonly errorSlot       = signal<string | null>(null);
  readonly formacion       = signal<Formacion>((localStorage.getItem('formacion') as Formacion) ?? '1-2-2-2');
  readonly movidos         = signal<string[]>([]);
  readonly detalle         = signal<IJugadorFantasy | null>(null);
  readonly confirmandoVenta = signal(false);
  readonly vendiendo       = signal(false);
  readonly sustituyendo    = signal(false);

  // Hoy el backend reembolsa precio_compra completo (= precio). La economía
  // de "media cláusula" requiere columna `clausula` en backend (ver FANTASY-PENDIENTE).
  readonly importeVenta = computed(() => this.detalle()?.precio ?? 0);

  // Titulares de la misma posición que el jugador del modal: candidatos a ser sustituidos.
  readonly titularesSustituibles = computed<IJugadorFantasy[]>(() => {
    const j = this.detalle();
    if (!j) return [];
    return this.titulares().filter(t => t.posicion === j.posicion);
  });

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

  get equipo(): { nombre: string; propietario: string; puntuacionTotal: number; presupuesto: number } {
    const m = this.fantasy.miembro();
    return {
      nombre:            m?.nombre_equipo ?? 'Mi Equipo',
      propietario:       m?.nombre_equipo ?? '',
      puntuacionTotal:   m?.puntos_total  ?? 0,
      presupuesto:       m?.presupuesto   ?? 50,
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

    this.abrirDetalle(id);
  }

  seleccionarSlot(posicion: IJugadorFantasy['posicion']): void {
    this.slotPendiente.set(this.slotPendiente() === posicion ? null : posicion);
  }

  cancelar(): void {
    this.seleccionado.set(null);
    this.slotPendiente.set(null);
    this.errorSlot.set(null);
  }

  // ── Modal de detalle de jugador ──

  abrirDetalle(id: string): void {
    const j = this.jugadores().find(p => p.id === id) ?? null;
    this.detalle.set(j);
    this.seleccionado.set(id);
    this.slotPendiente.set(null);
    this.confirmandoVenta.set(false);
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
    this.seleccionado.set(null);
    this.confirmandoVenta.set(false);
    this.sustituyendo.set(false);
  }

  subirAlOnce(): void {
    const j = this.detalle();
    if (!j || j.titular) return;
    const config = FORMACIONES[this.formacion()];
    const titularesEnPos = this.titulares().filter(t => t.posicion === j.posicion).length;
    if (titularesEnPos >= config[j.posicion]) {
      this.sustituyendo.set(true);
      return;
    }
    this._promoverATitular(j.id);
    this.cerrarDetalle();
  }

  sustituirPor(titularId: string): void {
    const entra = this.detalle();
    if (!entra) return;
    const updated = this.jugadores().map(p => {
      if (p.id === entra.id)  return { ...p, titular: true };
      if (p.id === titularId) return { ...p, titular: false };
      return p;
    });
    this.fantasy.miEquipo.set(updated);
    this.fantasy.actualizarPlantilla(
      updated.map(p => ({ jugador_id: p.id, es_titular: p.titular, es_capitan: false }))
    );
    this.cerrarDetalle();
  }

  moverAlBanquillo(): void {
    const j = this.detalle();
    if (!j || !j.titular) return;
    const updated = this.jugadores().map(p => p.id === j.id ? { ...p, titular: false } : p);
    this.fantasy.miEquipo.set(updated);
    this.fantasy.actualizarPlantilla(
      updated.map(p => ({ jugador_id: p.id, es_titular: p.titular, es_capitan: false }))
    );
    this.cerrarDetalle();
  }

  async venderInstantaneamente(): Promise<void> {
    const j = this.detalle();
    if (!j || this.vendiendo()) return;
    this.vendiendo.set(true);
    try {
      await this.fantasy.venderJugador(j.id);
      this.cerrarDetalle();
    } catch {
      this._mostrarError('No se pudo vender al jugador. El mercado puede estar cerrado.');
      this.cerrarDetalle();
    } finally {
      this.vendiendo.set(false);
    }
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
