import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { IClasificacionFantasy, IJugadorFantasy } from '../models/fantasy.model';
import { AuthService } from './auth.service';

interface ApiResp<T> { data: T | null }

export interface ApiLiga {
  id: string; nombre: string; codigo_invitacion: string;
  creador_id: string; jornada_inicio: number;
}
interface ApiMiembro {
  id: string; liga_id: string; usuario_id: string;
  nombre_equipo: string; presupuesto: number; puntos_total: number;
}
interface ApiClasificacionFantasy {
  liga_id: string; miembro_id: string; usuario_id: string;
  nombre_equipo: string; puntos_total: number; presupuesto: number; posicion: number;
}
interface ApiLigaDetalle extends ApiLiga {
  clasificacion: ApiClasificacionFantasy[];
  mercado_activo: boolean;
}
interface ApiEquipo { nombre: string; abrev: string }
interface ApiJugadorBase {
  id: string; nombre: string; posicion: string;
  precio_fantasy: number; estado_fantasy: string;
  foto_url: string | null;
  equipo: ApiEquipo | null;
}
interface ApiPlantillaItem {
  id: string; miembro_id: string; jugador_id: string;
  jugador: ApiJugadorBase | null;
  es_titular: boolean; es_capitan: boolean; precio_compra: number;
  clausula: number;
  puntos_total: number;
  precio_venta?: number | null;
}
interface ApiJugadorMercado extends ApiJugadorBase {
  activo: boolean;
  en_venta: boolean;
  precio_venta: number | null;
  vendedor: string | null;
  vendedor_miembro_id: string | null;
}

@Injectable({ providedIn: 'root' })
export class FantasyService {
  private readonly http  = inject(HttpClient);
  private readonly auth  = inject(AuthService);
  private readonly base  = environment.apiUrl;
  private readonly LIGA_KEY = 'fantasy_liga_activa_id';

  readonly misLigas       = signal<ApiLiga[]>([]);
  readonly ligaActiva     = signal<ApiLiga | null>(null);
  readonly miembro        = signal<ApiMiembro | null>(null);
  readonly miEquipo       = signal<IJugadorFantasy[]>([]);
  readonly clasificacion  = signal<IClasificacionFantasy[]>([]);
  readonly mercado        = signal<IJugadorFantasy[]>([]);
  readonly mercadoAbierto = signal(false);
  readonly cargando       = signal(false);
  readonly error          = signal<string | null>(null);

  readonly enLiga      = computed(() => this.ligaActiva() !== null);
  readonly presupuesto = computed(() => this.miembro()?.presupuesto ?? 50);
  readonly ligaId      = computed(() => this.ligaActiva()?.id ?? null);

  seleccionarLiga(liga: ApiLiga): void {
    localStorage.setItem(this.LIGA_KEY, liga.id);
    this.ligaActiva.set(liga);
    this._cargarDatosLiga(liga.id);
  }

  inicializar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.http.get<ApiResp<ApiLiga[]>>(`${this.base}/fantasy/ligas`).subscribe({
      next: r => {
        const ligas = r.data ?? [];
        this.misLigas.set(ligas);
        if (ligas.length > 0) {
          const savedId = localStorage.getItem(this.LIGA_KEY);
          const liga = ligas.find(l => l.id === savedId) ?? ligas[0];
          this.ligaActiva.set(liga);
          this._cargarDatosLiga(liga.id);
        } else {
          this.cargando.set(false);
        }
      },
      error: () => this.cargando.set(false),
    });
  }

  cargarMercado(): void {
    const id = this.ligaId();
    if (!id) return;
    this.http.get<ApiResp<ApiJugadorMercado[]>>(`${this.base}/fantasy/ligas/${id}/mercado`).subscribe({
      next: r => this.mercado.set(r.data?.map(j => this._mapJugadorMercado(j)) ?? []),
    });
  }

  async crearLiga(nombre: string, nombreEquipo: string): Promise<string> {
    const r = await firstValueFrom(
      this.http.post<ApiResp<{ liga_id: string; codigo: string }>>(
        `${this.base}/fantasy/ligas`,
        { nombre, nombre_equipo: nombreEquipo }
      )
    );
    return r.data?.codigo ?? '';
  }

  async unirseALiga(codigo: string, nombreEquipo: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.base}/fantasy/ligas/unirse`, { codigo, nombre_equipo: nombreEquipo })
    );
  }

  async ficharJugador(jugadorId: string): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(
      this.http.post(`${this.base}/fantasy/ligas/${id}/fichajes`, { jugador_id: jugadorId })
    );
    this.mercado.update(lista => lista.filter(j => j.id !== jugadorId));
    this._cargarDatosLiga(id);
  }

  async salirDeLiga(): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(this.http.delete(`${this.base}/fantasy/ligas/${id}/salir`));
    this.ligaActiva.set(null);
    this.miembro.set(null);
    this.miEquipo.set([]);
    this.clasificacion.set([]);
    this.mercado.set([]);
  }

  async venderJugador(jugadorId: string): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(
      this.http.delete(`${this.base}/fantasy/ligas/${id}/fichajes/${jugadorId}`)
    );
    this._cargarDatosLiga(id);
  }

  // Plantilla de otro miembro de la liga (solo lectura, para el cláusulazo).
  async verEquipoMiembro(miembroId: string): Promise<IJugadorFantasy[]> {
    const id = this.ligaId();
    if (!id) return [];
    const r = await firstValueFrom(
      this.http.get<ApiResp<ApiPlantillaItem[]>>(
        `${this.base}/fantasy/ligas/${id}/miembros/${miembroId}/equipo`
      )
    );
    return r.data?.map(item => this._mapPlantillaItem(item)) ?? [];
  }

  // Robar un jugador de otro equipo pagando su cláusula.
  async clausulazo(jugadorId: string): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(
      this.http.post(`${this.base}/fantasy/ligas/${id}/clausulazos`, { jugador_id: jugadorId })
    );
    this._cargarDatosLiga(id);
  }

  // Listar un jugador propio en el mercado (precio ≥ precio_compra).
  async listarJugador(jugadorId: string, precio: number): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(
      this.http.post(`${this.base}/fantasy/ligas/${id}/mercado/listados`, { jugador_id: jugadorId, precio })
    );
    this.refrescarMiEquipo();
  }

  // Cancelar el anuncio de venta de un jugador propio.
  async cancelarListado(jugadorId: string): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(
      this.http.delete(`${this.base}/fantasy/ligas/${id}/mercado/listados/${jugadorId}`)
    );
    this.refrescarMiEquipo();
  }

  // Comprar un jugador listado por otro miembro.
  async comprarListado(jugadorId: string): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(
      this.http.post(`${this.base}/fantasy/ligas/${id}/mercado/listados/${jugadorId}/comprar`, {})
    );
    this._cargarDatosLiga(id);
  }

  // Subir la cláusula de un jugador propio (descuenta el incremento del presupuesto).
  async subirClausula(jugadorId: string, clausula: number): Promise<void> {
    const id = this.ligaId();
    if (!id) return;
    await firstValueFrom(
      this.http.patch(
        `${this.base}/fantasy/ligas/${id}/mi-equipo/${jugadorId}/clausula`,
        { clausula }
      )
    );
    this.refrescarMiEquipo();
    this.refrescarMiMiembro();
  }

  actualizarPlantilla(
    jugadores: { jugador_id: string; es_titular: boolean; es_capitan: boolean }[]
  ): void {
    const id = this.ligaId();
    if (!id) return;
    this.http.patch(`${this.base}/fantasy/ligas/${id}/mi-equipo`, { jugadores }).subscribe({
      error: () => this.refrescarMiEquipo(),
    });
  }

  refrescarMiEquipo(): void {
    const id = this.ligaId();
    if (!id) return;
    this.http.get<ApiResp<ApiPlantillaItem[]>>(`${this.base}/fantasy/ligas/${id}/mi-equipo`).subscribe({
      next: r => this.miEquipo.set(r.data?.map(item => this._mapPlantillaItem(item)) ?? []),
    });
  }

  refrescarMiMiembro(): void {
    const id = this.ligaId();
    if (!id) return;
    this.http.get<ApiResp<ApiMiembro>>(`${this.base}/fantasy/ligas/${id}/mi-miembro`).subscribe({
      next: r => { if (r.data) this.miembro.set(r.data); },
    });
  }

  private _cargarDatosLiga(ligaId: string): void {
    const uid = this.auth.usuario()?.uid ?? '';

    this.http.get<ApiResp<ApiLigaDetalle>>(`${this.base}/fantasy/ligas/${ligaId}`).subscribe({
      next: r => {
        const clasi = r.data?.clasificacion ?? [];
        this.clasificacion.set(clasi.map(c => this._mapClasificacion(c, uid)));
        this.mercadoAbierto.set(r.data?.mercado_activo ?? false);
      },
    });

    this.http.get<ApiResp<ApiMiembro>>(`${this.base}/fantasy/ligas/${ligaId}/mi-miembro`).subscribe({
      next: r => { if (r.data) this.miembro.set(r.data); },
    });

    this.http.get<ApiResp<ApiPlantillaItem[]>>(`${this.base}/fantasy/ligas/${ligaId}/mi-equipo`).subscribe({
      next: r => {
        this.miEquipo.set(r.data?.map(item => this._mapPlantillaItem(item)) ?? []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private _mapClasificacion(c: ApiClasificacionFantasy, uid: string): IClasificacionFantasy {
    return {
      posicion:    c.posicion,
      equipo:      c.nombre_equipo,
      propietario: c.nombre_equipo,
      puntos:      c.puntos_total,
      pj:          0,
      miembroId:   c.miembro_id,
      esUsuario:   c.usuario_id === uid,
    };
  }

  private _mapPlantillaItem(item: ApiPlantillaItem): IJugadorFantasy {
    return {
      id:               item.jugador_id,
      nombre:           item.jugador?.nombre         ?? '',
      equipo:           item.jugador?.equipo?.nombre ?? '',
      posicion:         (item.jugador?.posicion       ?? 'delantero') as IJugadorFantasy['posicion'],
      puntuacionJornada: 0,
      puntuacionTotal:  item.puntos_total ?? 0,
      precio:           Number(item.precio_compra),
      estado:           (item.jugador?.estado_fantasy ?? 'disponible') as IJugadorFantasy['estado'],
      titular:          item.es_titular,
      clausula:         Number(item.clausula ?? item.precio_compra),
      fotoUrl:          item.jugador?.foto_url ?? undefined,
      enVenta:          item.precio_venta != null,
      precioVenta:      item.precio_venta != null ? Number(item.precio_venta) : undefined,
    };
  }

  private _mapJugadorMercado(j: ApiJugadorMercado): IJugadorFantasy {
    return {
      id:               j.id,
      nombre:           j.nombre,
      equipo:           j.equipo?.nombre ?? '',
      posicion:         j.posicion       as IJugadorFantasy['posicion'],
      puntuacionJornada: 0,
      puntuacionTotal:  0,
      precio:           Number(j.precio_fantasy),
      estado:           j.estado_fantasy as IJugadorFantasy['estado'],
      titular:          false,
      fotoUrl:          j.foto_url ?? undefined,
      enVenta:          j.en_venta,
      precioVenta:      j.precio_venta != null ? Number(j.precio_venta) : undefined,
      vendedor:         j.vendedor ?? undefined,
    };
  }
}
