import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IClasificacionEntry } from '../models/clasificacion.model';
import { IGoleadorJornada } from '../models/jugador.model';
import { IPartido, EstadoPartido } from '../models/partido.model';
import { ICruce } from '../models/torneo.model';
import { IEquipo } from '../models/equipo.model';

interface ApiResp<T> { data: T | null }

interface ApiClasificacion {
  equipo_id: string; nombre: string; abrev: string; color: string;
  pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; puntos: number;
}
interface ApiPartido {
  id: string;
  equipo_local:     { nombre: string; abrev: string } | null;
  equipo_visitante: { nombre: string; abrev: string } | null;
  goles_local: number | null; goles_visitante: number | null;
  estado: string; hora_inicio: string; minuto: string | null;
}
interface ApiCruce {
  id: string; fase: string;
  equipo_local:     { nombre: string } | null;
  equipo_visitante: { nombre: string } | null;
  goles_local: number | null; goles_visitante: number | null;
  estado: string;
}
interface ApiGoleador {
  id: string; nombre: string; equipo: string; posicion: string;
  goles: number; asistencias: number;
}
interface ApiEquipoDetalle {
  id: string; nombre: string; abrev: string; color: string;
  jugadores: Array<{ id: string; nombre: string; dorsal: number | null; posicion: string }>;
}

export interface CrucesPorFase {
  cuartos: ICruce[];
  semis:   ICruce[];
  final:   ICruce | null;
}

@Injectable({ providedIn: 'root' })
export class LigaRealService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  readonly clasificacion  = signal<IClasificacionEntry[]>([]);
  readonly partidos       = signal<IPartido[]>([]);
  readonly goleadores     = signal<IGoleadorJornada[]>([]);
  readonly cruces         = signal<CrucesPorFase>({ cuartos: [], semis: [], final: null });
  readonly jornadaActual  = signal<number>(0);
  readonly equipos        = signal<IEquipo[]>([]);
  readonly equipoDetalle  = signal<IEquipo | null>(null);

  cargarClasificacion(): void {
    this.http.get<ApiResp<ApiClasificacion[]>>(`${this.base}/clasificacion`).subscribe({
      next: r => this.clasificacion.set(r.data?.map((c, i) => this.mapClasificacion(c, i)) ?? []),
    });
  }

  cargarPartidos(): void {
    this.http.get<ApiResp<ApiPartido[]>>(`${this.base}/partidos`).subscribe({
      next: r => {
        const mapped = r.data?.map(p => this.mapPartido(p)) ?? [];
        this.partidos.set(mapped);
      },
    });
    this.http.get<ApiResp<Array<{ numero: number; estado: string }>>>(`${this.base}/jornadas`).subscribe({
      next: r => {
        const list = r.data ?? [];
        const activa = list.find(j => j.estado === 'en_curso')
                    ?? list.filter(j => j.estado === 'finalizada').at(-1);
        if (activa) this.jornadaActual.set(activa.numero);
      },
    });
  }

  cargarGoleadores(): void {
    this.http.get<ApiResp<ApiGoleador[]>>(`${this.base}/goleadores`).subscribe({
      next: r => this.goleadores.set(r.data ?? []),
    });
  }

  cargarCruces(): void {
    this.http.get<ApiResp<ApiCruce[]>>(`${this.base}/cruces`).subscribe({
      next: r => {
        const todos = r.data ?? [];
        this.cruces.set({
          cuartos: todos.filter(c => c.fase === 'cuartos').map(c => this.mapCruce(c)),
          semis:   todos.filter(c => c.fase === 'semis').map(c => this.mapCruce(c)),
          final:   (() => { const f = todos.find(c => c.fase === 'final'); return f ? this.mapCruce(f) : null; })(),
        });
      },
    });
  }

  cargarEquipos(): void {
    this.http.get<ApiResp<ApiClasificacion[]>>(`${this.base}/clasificacion`).subscribe({
      next: r => this.equipos.set(
        (r.data ?? []).map((c, i) => ({
          id:        c.equipo_id,
          nombre:    c.nombre,
          abrev:     c.abrev,
          color:     c.color,
          posicion:  i + 1,
          stats:     { pj: c.pj, v: c.pg, e: c.pe, d: c.pp, gf: c.gf, gc: c.gc, pts: c.puntos },
          jugadores: [],
        }))
      ),
    });
  }

  cargarEquipoDetalle(id: string): void {
    this.equipoDetalle.set(null);
    forkJoin({
      equipo: this.http.get<ApiResp<ApiEquipoDetalle>>(`${this.base}/equipos/${id}`),
      clas:   this.http.get<ApiResp<ApiClasificacion[]>>(`${this.base}/clasificacion`),
    }).subscribe({
      next: ({ equipo, clas }) => {
        const e = equipo.data;
        if (!e) return;
        const clasList = clas.data ?? [];
        const posIdx   = clasList.findIndex(c => c.equipo_id === id);
        const statsRow = clasList[posIdx];
        this.equipoDetalle.set({
          id:        e.id,
          nombre:    e.nombre,
          abrev:     e.abrev,
          color:     e.color,
          posicion:  posIdx >= 0 ? posIdx + 1 : 0,
          stats:     statsRow
            ? { pj: statsRow.pj, v: statsRow.pg, e: statsRow.pe, d: statsRow.pp, gf: statsRow.gf, gc: statsRow.gc, pts: statsRow.puntos }
            : { pj: 0, v: 0, e: 0, d: 0, gf: 0, gc: 0, pts: 0 },
          jugadores: e.jugadores.map(j => ({
            id:          j.id,
            nombre:      j.nombre,
            dorsal:      j.dorsal ?? 0,
            posicion:    j.posicion as 'POR' | 'DEF' | 'MC' | 'DEL',
            goles:       0,
            asistencias: 0,
          })),
        });
      },
    });
  }

  private mapClasificacion(c: ApiClasificacion, idx: number): IClasificacionEntry {
    return { posicion: idx + 1, equipo: c.nombre, pj: c.pj, pg: c.pg, pe: c.pe, pp: c.pp, gf: c.gf, gc: c.gc, puntos: c.puntos };
  }

  private mapPartido(p: ApiPartido): IPartido {
    return {
      id: p.id,
      equipoLocal:      p.equipo_local?.nombre      ?? '',
      abrevLocal:       p.equipo_local?.abrev        ?? '',
      equipoVisitante:  p.equipo_visitante?.nombre   ?? '',
      abrevVisitante:   p.equipo_visitante?.abrev    ?? '',
      golesLocal:       p.goles_local,
      golesVisitante:   p.goles_visitante,
      minuto:           p.minuto,
      estado:           p.estado as EstadoPartido,
      horaInicio:       p.hora_inicio,
    };
  }

  private mapCruce(c: ApiCruce): ICruce {
    return {
      id: c.id,
      equipoLocal:     c.equipo_local?.nombre     ?? null,
      equipoVisitante: c.equipo_visitante?.nombre ?? null,
      golesLocal:      c.goles_local,
      golesVisitante:  c.goles_visitante,
      estado:          c.estado as ICruce['estado'],
    };
  }
}
