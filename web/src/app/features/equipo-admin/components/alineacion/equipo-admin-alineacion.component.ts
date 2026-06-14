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

  readonly jugadores = signal<IEntrenadorJugador[]>([]);
  readonly cargando  = signal(false);
  readonly formacion = signal<Formacion>(
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

  normPos(p: string): PosNorm { return normPos(p); }

  posAbrev(pos: PosNorm): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }

  private buildSlots(pos: PosNorm, max: number): Slot[] {
    const found = this.titulares().filter(j => normPos(j.posicion) === pos);
    return Array.from({ length: max }, (_, i) => ({ jugador: found[i] ?? null, posicion: pos }));
  }
}
