import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface ApiResp<T> { data: T | null }

export interface AdminJornada {
  id: string;
  numero: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  mercado_activo: boolean;
}

export interface AdminPartido {
  id: string;
  jornada_id: string;
  hora_inicio: string;
  estado: string;
  goles_local: number | null;
  goles_visitante: number | null;
  equipo_local: { id: string; nombre: string } | null;
  equipo_visitante: { id: string; nombre: string } | null;
}

export interface AdminJugador {
  id: string;
  nombre: string;
  dorsal: number | null;
  posicion: string;
  estado_fantasy: string;
  precio_fantasy: number;
  activo: boolean;
  equipo_id: string;
  equipo: { id: string; nombre: string } | null;
  foto_url: string | null;
}

export interface AdminEquipo {
  id: string;
  nombre: string;
  foto_url: string | null;
  entrenador_id: string | null;
  entrenador: { nombre: string } | null;
}

export interface AdminEstadistica {
  jugador_id: string;
  partido_id: string;
  goles: number;
  asistencias: number;
  tarjeta_amarilla: boolean;
  tarjeta_roja: boolean;
  minutos_jugados: number;
  portero_sin_goles: boolean;
  puntos_fantasy: number;
}

export interface AdminEstadisticaIn {
  jugador_id: string;
  goles: number;
  asistencias: number;
  tarjeta_amarilla: boolean;
  tarjeta_roja: boolean;
  minutos_jugados: number;
  portero_sin_goles: boolean;
}

export interface AdminParticipante {
  posicion: number;
  miembro_id: string;
  nombre_equipo: string;
  manager: string;
  puntos_total: number;
  presupuesto: number;
}

export interface AdminPerfil {
  id: string;
  nombre: string;
}

export interface AdminLiga {
  id: string;
  nombre: string;
  codigo_invitacion: string;
}

@Injectable({ providedIn: 'root' })
export class SuperadminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  // Jornadas
  getJornadas(): Observable<AdminJornada[]> {
    return this.http.get<ApiResp<AdminJornada[]>>(`${this.base}/jornadas`).pipe(map(r => r.data ?? []));
  }

  crearJornada(body: { numero: number; fecha_inicio: string; fecha_fin: string }): Observable<AdminJornada> {
    return this.http.post<ApiResp<AdminJornada>>(`${this.base}/jornadas`, body).pipe(map(r => r.data!));
  }

  actualizarJornada(id: string, body: Partial<Pick<AdminJornada, 'estado' | 'mercado_activo'>>): Observable<AdminJornada> {
    return this.http.patch<ApiResp<AdminJornada>>(`${this.base}/jornadas/${id}`, body).pipe(map(r => r.data!));
  }

  // Partidos
  getPartidos(jornadaId?: string): Observable<AdminPartido[]> {
    const params = jornadaId ? `?jornada_id=${jornadaId}` : '';
    return this.http.get<ApiResp<AdminPartido[]>>(`${this.base}/partidos${params}`).pipe(map(r => r.data ?? []));
  }

  crearPartido(body: { jornada_id: string; equipo_local_id: string; equipo_visitante_id: string; hora_inicio: string }): Observable<AdminPartido> {
    return this.http.post<ApiResp<AdminPartido>>(`${this.base}/partidos`, body).pipe(map(r => r.data!));
  }

  actualizarPartido(id: string, body: { goles_local: number; goles_visitante: number; estado?: string }): Observable<AdminPartido> {
    return this.http.patch<ApiResp<AdminPartido>>(`${this.base}/partidos/${id}`, body).pipe(map(r => r.data!));
  }

  // Estadísticas de partido
  getEstadisticas(partidoId: string): Observable<AdminEstadistica[]> {
    return this.http.get<ApiResp<AdminEstadistica[]>>(`${this.base}/partidos/${partidoId}/estadisticas`).pipe(map(r => r.data ?? []));
  }

  putEstadisticas(partidoId: string, estadisticas: AdminEstadisticaIn[]): Observable<AdminEstadistica[]> {
    return this.http.put<ApiResp<AdminEstadistica[]>>(`${this.base}/partidos/${partidoId}/estadisticas`, { estadisticas }).pipe(map(r => r.data ?? []));
  }

  // Jugadores
  getJugadores(equipoId?: string): Observable<AdminJugador[]> {
    const params = equipoId ? `?equipo_id=${equipoId}` : '';
    return this.http.get<ApiResp<AdminJugador[]>>(`${this.base}/jugadores${params}`).pipe(map(r => r.data ?? []));
  }

  crearJugador(body: { equipo_id: string; nombre: string; dorsal?: number; posicion: string; precio_fantasy?: number; foto_url?: string }): Observable<AdminJugador> {
    return this.http.post<ApiResp<AdminJugador>>(`${this.base}/jugadores`, body).pipe(map(r => r.data!));
  }

  actualizarJugador(id: string, body: Partial<Pick<AdminJugador, 'nombre' | 'dorsal' | 'posicion' | 'precio_fantasy' | 'estado_fantasy' | 'foto_url'>>): Observable<AdminJugador> {
    return this.http.patch<ApiResp<AdminJugador>>(`${this.base}/jugadores/${id}`, body).pipe(map(r => r.data!));
  }

  darDeBaja(id: string): Observable<AdminJugador> {
    return this.http.delete<ApiResp<AdminJugador>>(`${this.base}/jugadores/${id}`).pipe(map(r => r.data!));
  }

  eliminarFotoJugador(id: string): Observable<AdminJugador> {
    return this.http.delete<ApiResp<AdminJugador>>(`${this.base}/jugadores/${id}/foto`).pipe(map(r => r.data!));
  }

  // Equipos
  getEquipos(): Observable<AdminEquipo[]> {
    return this.http.get<ApiResp<AdminEquipo[]>>(`${this.base}/equipos`).pipe(map(r => r.data ?? []));
  }

  crearEquipo(body: { nombre: string; foto_url?: string }): Observable<AdminEquipo> {
    return this.http.post<ApiResp<AdminEquipo>>(`${this.base}/equipos`, body).pipe(map(r => r.data!));
  }

  actualizarEquipo(id: string, body: Partial<Pick<AdminEquipo, 'nombre' | 'foto_url' | 'entrenador_id'>>): Observable<AdminEquipo> {
    return this.http.patch<ApiResp<AdminEquipo>>(`${this.base}/equipos/${id}`, body).pipe(map(r => r.data!));
  }

  // Puntuaciones
  calcularPuntuaciones(jornadaNumero: number): Observable<{ miembros_calculados: number; jornada: number }> {
    return this.http
      .post<ApiResp<{ miembros_calculados: number; jornada: number }>>(`${this.base}/puntuaciones/calcular/${jornadaNumero}`, {})
      .pipe(map(r => r.data!));
  }

  // Perfiles
  getPerfiles(): Observable<AdminPerfil[]> {
    return this.http.get<ApiResp<AdminPerfil[]>>(`${this.base}/perfiles`).pipe(map(r => r.data ?? []));
  }

  // Ligas fantasy
  getLigas(): Observable<AdminLiga[]> {
    return this.http.get<ApiResp<AdminLiga[]>>(`${this.base}/ligas`).pipe(map(r => r.data ?? []));
  }

  getParticipantes(ligaId: string): Observable<AdminParticipante[]> {
    return this.http.get<ApiResp<AdminParticipante[]>>(`${this.base}/ligas/${ligaId}/participantes`).pipe(map(r => r.data ?? []));
  }
}
