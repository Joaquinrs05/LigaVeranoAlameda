import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AdminEquipo, AdminEstadisticaIn, AdminJornada, AdminJugador, AdminPartido,
  SuperadminService,
} from '../../../../core/services/superadmin.service';

interface JugadorStatEdit extends AdminEstadisticaIn {
  nombre: string;
  posicion: string;
  equipo_id: string;
}

interface PartidoEditable extends AdminPartido {
  golesLocalEdit: number;
  golesVisitanteEdit: number;
  guardado: boolean;
  expandido: boolean;
  cargandoStats: boolean;
  statsGuardadas: boolean;
  jugadoresStats: JugadorStatEdit[];
}

@Component({
  selector: 'app-superadmin-resultados',
  standalone: true,
  templateUrl: './superadmin-resultados.component.html',
  imports: [FormsModule],
})
export class SuperadminResultadosComponent implements OnInit {
  private readonly svc = inject(SuperadminService);

  readonly jornadas             = signal<AdminJornada[]>([]);
  readonly partidos             = signal<PartidoEditable[]>([]);
  readonly equipos              = signal<AdminEquipo[]>([]);
  readonly jornadaSeleccionada  = signal<AdminJornada | null>(null);
  readonly cargando             = signal(false);
  readonly error                = signal<string | null>(null);
  readonly mostrarFormulario    = signal(false);

  nuevoPartido = { equipo_local_id: '', equipo_visitante_id: '', hora_inicio: '' };

  ngOnInit(): void {
    this.svc.getEquipos().subscribe({ next: lista => this.equipos.set(lista) });
    this.svc.getJornadas().subscribe({
      next: lista => {
        this.jornadas.set(lista);
        const activa = lista.find(j => j.estado === 'en_curso') ?? lista.filter(j => j.estado === 'finalizada').at(-1) ?? null;
        if (activa) this.seleccionarJornada(activa);
      },
    });
  }

  seleccionarJornada(jornada: AdminJornada): void {
    this.jornadaSeleccionada.set(jornada);
    this.mostrarFormulario.set(false);
    this.cargando.set(true);
    this.svc.getPartidos(jornada.id).subscribe({
      next: lista => {
        this.partidos.set(lista.map(p => this._toEditable(p)));
        this.cargando.set(false);
      },
      error: () => { this.error.set('Error al cargar partidos'); this.cargando.set(false); },
    });
  }

  toggleExpandir(p: PartidoEditable): void {
    if (p.expandido) {
      this.partidos.update(list => list.map(x => x.id === p.id ? { ...x, expandido: false } : x));
      return;
    }

    if (p.jugadoresStats.length > 0) {
      this.partidos.update(list => list.map(x => x.id === p.id ? { ...x, expandido: true } : x));
      return;
    }

    this.partidos.update(list => list.map(x => x.id === p.id ? { ...x, expandido: true, cargandoStats: true } : x));

    const localId     = p.equipo_local?.id;
    const visitanteId = p.equipo_visitante?.id;
    if (!localId || !visitanteId) {
      this.partidos.update(list => list.map(x => x.id === p.id ? { ...x, cargandoStats: false } : x));
      return;
    }

    forkJoin({
      local:     this.svc.getJugadores(localId),
      visitante: this.svc.getJugadores(visitanteId),
      stats:     this.svc.getEstadisticas(p.id),
    }).subscribe({
      next: ({ local, visitante, stats }) => {
        const statsMap = new Map(stats.map(s => [s.jugador_id, s]));
        const toRow = (j: AdminJugador): JugadorStatEdit => {
          const s = statsMap.get(j.id);
          return {
            jugador_id:        j.id,
            nombre:            j.nombre,
            posicion:          j.posicion,
            equipo_id:         j.equipo_id,
            goles:             s?.goles             ?? 0,
            asistencias:       s?.asistencias       ?? 0,
            tarjeta_amarilla:  s?.tarjeta_amarilla  ?? false,
            tarjeta_roja:      s?.tarjeta_roja      ?? false,
            minutos_jugados:   s?.minutos_jugados    ?? 0,
            portero_sin_goles: s?.portero_sin_goles ?? false,
          };
        };
        this.partidos.update(list => list.map(x => x.id === p.id
          ? { ...x, cargandoStats: false, jugadoresStats: [...local, ...visitante].map(toRow) }
          : x
        ));
      },
      error: () => {
        this.error.set('Error al cargar estadísticas');
        this.partidos.update(list => list.map(x => x.id === p.id ? { ...x, cargandoStats: false } : x));
      },
    });
  }

  guardarStats(p: PartidoEditable): void {
    this.svc.putEstadisticas(p.id, p.jugadoresStats).subscribe({
      next: () => {
        this.partidos.update(list => list.map(x => x.id === p.id ? { ...x, statsGuardadas: true } : x));
        setTimeout(() => {
          this.partidos.update(list => list.map(x => x.id === p.id ? { ...x, statsGuardadas: false } : x));
        }, 2000);
      },
      error: () => this.error.set('Error al guardar estadísticas'),
    });
  }

  crearPartido(): void {
    const jornada = this.jornadaSeleccionada();
    if (!jornada || !this.nuevoPartido.equipo_local_id || !this.nuevoPartido.equipo_visitante_id) return;
    if (this.nuevoPartido.equipo_local_id === this.nuevoPartido.equipo_visitante_id) {
      this.error.set('El equipo local y visitante no pueden ser el mismo');
      return;
    }
    this.error.set(null);
    this.svc.crearPartido({
      jornada_id: jornada.id,
      equipo_local_id: this.nuevoPartido.equipo_local_id,
      equipo_visitante_id: this.nuevoPartido.equipo_visitante_id,
      hora_inicio: this.nuevoPartido.hora_inicio,
    }).subscribe({
      next: nuevo => {
        const local     = this.equipos().find(e => e.id === this.nuevoPartido.equipo_local_id);
        const visitante = this.equipos().find(e => e.id === this.nuevoPartido.equipo_visitante_id);
        this.partidos.update(list => [...list, {
          ...this._toEditable({
            ...nuevo,
            equipo_local:     local     ? { id: local.id,     nombre: local.nombre }     : nuevo.equipo_local,
            equipo_visitante: visitante ? { id: visitante.id, nombre: visitante.nombre } : nuevo.equipo_visitante,
          }),
        }]);
        this.nuevoPartido = { equipo_local_id: '', equipo_visitante_id: '', hora_inicio: '' };
        this.mostrarFormulario.set(false);
      },
      error: () => this.error.set('Error al crear el partido'),
    });
  }

  guardarPartido(p: PartidoEditable): void {
    this.svc.actualizarPartido(p.id, { goles_local: p.golesLocalEdit, goles_visitante: p.golesVisitanteEdit, estado: 'finished' }).subscribe({
      next: updated => {
        this.partidos.update(list => list.map(x => x.id === updated.id
          ? { ...x, goles_local: updated.goles_local, goles_visitante: updated.goles_visitante, guardado: true }
          : x
        ));
        setTimeout(() => {
          this.partidos.update(list => list.map(x => x.id === updated.id ? { ...x, guardado: false } : x));
        }, 2000);
      },
      error: () => this.error.set('Error al guardar resultado'),
    });
  }

  jugadoresDeEquipo(p: PartidoEditable, equipoId: string | undefined): JugadorStatEdit[] {
    return p.jugadoresStats.filter(j => j.equipo_id === equipoId);
  }

  posicionAbrev(pos: string): string {
    return ({ portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' } as Record<string, string>)[pos] ?? pos;
  }

  private _toEditable(p: AdminPartido): PartidoEditable {
    return {
      ...p,
      golesLocalEdit:     p.goles_local     ?? 0,
      golesVisitanteEdit: p.goles_visitante ?? 0,
      guardado:           false,
      expandido:          false,
      cargandoStats:      false,
      statsGuardadas:     false,
      jugadoresStats:     [],
    };
  }
}
