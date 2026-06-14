import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { EntrenadorService } from '../../../../core/services/entrenador.service';
import { IEntrenadorJugador } from '../../../../core/models/equipo-admin.model';
import { PlayerCardComponent } from '../../../../shared/components/player-card/player-card.component';

type PosNorm = 'portero' | 'defensa' | 'centrocampista' | 'delantero';
type Formacion = '1-2-2-2' | '1-3-2-1' | '1-2-3-1' | '1-3-1-2' | '1-1-3-2';

interface Slot { jugador: IEntrenadorJugador | null; posicion: PosNorm }

const FORMACIONES: Record<Formacion, { portero: number; defensa: number; centrocampista: number; delantero: number }> = {
  '1-2-2-2': { portero: 1, defensa: 2, centrocampista: 2, delantero: 2 },
  '1-3-2-1': { portero: 1, defensa: 3, centrocampista: 2, delantero: 1 },
  '1-2-3-1': { portero: 1, defensa: 2, centrocampista: 3, delantero: 1 },
  '1-3-1-2': { portero: 1, defensa: 3, centrocampista: 1, delantero: 2 },
  '1-1-3-2': { portero: 1, defensa: 1, centrocampista: 3, delantero: 2 },
};

function normPos(p: string): PosNorm {
  const l = p.toLowerCase();
  if (l === 'por' || l === 'portero') return 'portero';
  if (l === 'def' || l === 'defensa') return 'defensa';
  if (l === 'mc'  || l === 'centrocampista') return 'centrocampista';
  return 'delantero';
}

@Component({
  selector: 'app-equipo-admin-alineacion',
  standalone: true,
  imports: [PlayerCardComponent],
  templateUrl: './equipo-admin-alineacion.component.html',
})
export class EquipoAdminAlineacionComponent implements OnInit {
  private readonly svc = inject(EntrenadorService);

  readonly equipoId = input<string | null>(null);

  readonly jugadores    = signal<IEntrenadorJugador[]>([]);
  readonly cargando     = signal(false);
  readonly seleccionado = signal<string | null>(null);
  readonly slotPendiente = signal<PosNorm | null>(null);
  readonly errorSlot    = signal<string | null>(null);
  readonly formacion    = signal<Formacion>(
    (localStorage.getItem('coach-formacion') as Formacion) ?? '1-2-2-2'
  );

  readonly formaciones: Formacion[] = Object.keys(FORMACIONES) as Formacion[];

  readonly titulares  = computed(() => this.jugadores().filter(j => j.es_titular));
  readonly suplentes  = computed(() => this.jugadores().filter(j => !j.es_titular));
  readonly sinData    = computed(() => this.jugadores().length === 0 && !this.cargando());

  readonly slotsPortero         = computed(() => this.buildSlots('portero',        FORMACIONES[this.formacion()].portero));
  readonly slotsDefensas        = computed(() => this.buildSlots('defensa',        FORMACIONES[this.formacion()].defensa));
  readonly slotsCentrocampistas = computed(() => this.buildSlots('centrocampista', FORMACIONES[this.formacion()].centrocampista));
  readonly slotsDelanteros      = computed(() => this.buildSlots('delantero',      FORMACIONES[this.formacion()].delantero));

  ngOnInit(): void {
    this.cargando.set(true);
    const id = this.equipoId();
    const obs = id ? this.svc.getJugadoresByEquipoId(id) : this.svc.getJugadores();
    obs.subscribe({
      next: j => { this.jugadores.set(j); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  cambiarFormacion(f: Formacion): void {
    this.formacion.set(f);
    localStorage.setItem('coach-formacion', f);
  }

  seleccionar(id: string): void {
    const pendiente = this.slotPendiente();
    if (pendiente) {
      const j = this.jugadores().find(p => p.id === id);
      if (j && !j.es_titular) {
        if (normPos(j.posicion) !== pendiente) {
          this._mostrarError(`${j.nombre.split(' ')[0]} es ${this.posAbrev(normPos(j.posicion))}, no puede jugar de ${this.posAbrev(pendiente)}`);
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

    if (jActual.es_titular === jTarget.es_titular) { this.seleccionado.set(null); return; }

    if (normPos(jActual.posicion) !== normPos(jTarget.posicion)) {
      this._mostrarError(
        `${jActual.nombre.split(' ')[0]} es ${this.posAbrev(normPos(jActual.posicion))}, no puede cambiar con ${jTarget.nombre.split(' ')[0]} (${this.posAbrev(normPos(jTarget.posicion))})`
      );
      return;
    }

    const updated = this.jugadores().map(j => {
      if (j.id === actual) return { ...j, es_titular: jTarget.es_titular };
      if (j.id === id)     return { ...j, es_titular: jActual.es_titular };
      return j;
    });
    this.jugadores.set(updated);
    this.seleccionado.set(null);
    this._guardarCambio(actual, jTarget.es_titular);
    this._guardarCambio(id, jActual.es_titular);
  }

  seleccionarSlot(pos: PosNorm): void {
    const id = this.seleccionado();
    if (id) {
      const j = this.jugadores().find(p => p.id === id);
      if (j && normPos(j.posicion) !== pos) {
        this._mostrarError(`${j.nombre.split(' ')[0]} es ${this.posAbrev(normPos(j.posicion))}, no puede jugar de ${this.posAbrev(pos)}`);
        return;
      }
      this._promoverATitular(id);
      return;
    }
    this.slotPendiente.set(pos);
  }

  cancelar(): void {
    this.seleccionado.set(null);
    this.slotPendiente.set(null);
    this.errorSlot.set(null);
  }

  normPos(p: string): PosNorm { return normPos(p); }

  posAbrev(pos: PosNorm): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }

  private buildSlots(pos: PosNorm, max: number): Slot[] {
    const found = this.titulares().filter(j => normPos(j.posicion) === pos);
    return Array.from({ length: max }, (_, i) => ({ jugador: found[i] ?? null, posicion: pos }));
  }

  private _promoverATitular(id: string): void {
    const j = this.jugadores().find(p => p.id === id);
    if (!j || j.es_titular) return;

    const config = FORMACIONES[this.formacion()];
    const titularesEnPos = this.titulares().filter(t => normPos(t.posicion) === normPos(j.posicion)).length;
    if (titularesEnPos >= config[normPos(j.posicion)]) {
      this._mostrarError(`Ya tienes el máximo de ${this.posAbrev(normPos(j.posicion))} en la formación ${this.formacion()}`);
      return;
    }

    const updated = this.jugadores().map(p =>
      p.id === id ? { ...p, es_titular: true } : p
    );
    this.jugadores.set(updated);
    this.seleccionado.set(null);
    this.slotPendiente.set(null);
    this._guardarCambio(id, true);
  }

  private _mostrarError(msg: string): void {
    this.errorSlot.set(msg);
    setTimeout(() => this.errorSlot.set(null), 2500);
  }

  private _guardarCambio(jugadorId: string, esTitular: boolean): void {
    const equipoId = this.equipoId();
    const obs = equipoId
      ? this.svc.actualizarJugadorEnEquipo(equipoId, jugadorId, { es_titular: esTitular })
      : this.svc.actualizarJugador(jugadorId, { es_titular: esTitular });
    obs.subscribe();
  }
}
