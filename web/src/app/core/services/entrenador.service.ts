import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IEntrenadorEquipo, IEntrenadorJugador } from '../models/equipo-admin.model';

interface ApiResp<T> { data: T | null }

@Injectable({ providedIn: 'root' })
export class EntrenadorService {
  private readonly http = inject(HttpClient);
  readonly base = `${environment.apiUrl}/equipo-admin`;

  getMiEquipo(): Observable<IEntrenadorEquipo> {
    return this.http
      .get<ApiResp<IEntrenadorEquipo>>(`${this.base}/mi-equipo`)
      .pipe(map(r => r.data!));
  }

  getJugadores(): Observable<IEntrenadorJugador[]> {
    return this.http
      .get<ApiResp<IEntrenadorJugador[]>>(`${this.base}/mi-equipo/jugadores`)
      .pipe(map(r => r.data ?? []));
  }

  actualizarJugador(
    id: string,
    body: Partial<Pick<IEntrenadorJugador, 'nombre' | 'dorsal' | 'posicion' | 'foto_url' | 'es_titular'>>,
  ): Observable<IEntrenadorJugador> {
    return this.http
      .patch<ApiResp<IEntrenadorJugador>>(`${this.base}/jugadores/${id}`, body)
      .pipe(map(r => r.data!));
  }
}
