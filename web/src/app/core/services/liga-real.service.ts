import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { IClasificacionEntry } from '../models/clasificacion.model';
import { IGoleadorJornada } from '../models/jugador.model';
import { IPartido, EstadoPartido } from '../models/partido.model';
import { ICruce } from '../models/torneo.model';

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
