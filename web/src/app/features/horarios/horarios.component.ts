import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LigaRealService } from '../../core/services/liga-real.service';
import { IPartido } from '../../core/models/partido.model';
import { IEquipo } from '../../core/models/equipo.model';

interface IGrupoFecha {
  key: string;
  label: string;
  partidos: IPartido[];
}

interface ICeldaCalendario {
  dia: number;
  key: string;
  enMes: boolean;
  conPartido: boolean;
  esHoy: boolean;
  esSeleccionado: boolean;
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, NgClass],
  templateUrl: './horarios.component.html',
})
export class HorariosComponent {
  private readonly liga = inject(LigaRealService);

  readonly diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  readonly mesVisible = signal<Date>(this.primerDiaMes(new Date()));
  readonly diaSeleccionado = signal<string | null>(null);

  constructor() {
    this.liga.cargarPartidos();
    this.liga.cargarEquipos();
  }

  private readonly equiposPorNombre = computed<Map<string, IEquipo>>(() => {
    const mapa = new Map<string, IEquipo>();
    for (const e of this.liga.equipos()) mapa.set(e.nombre, e);
    return mapa;
  });

  escudo(nombre: string): string | null {
    return this.equiposPorNombre().get(nombre)?.fotoUrl ?? null;
  }

  colorEquipo(nombre: string): string {
    return this.equiposPorNombre().get(nombre)?.color ?? 'var(--color-background)';
  }

  // Partidos por jugar (no finalizados), ordenados por fecha ascendente.
  private readonly proximos = computed<IPartido[]>(() =>
    this.liga.partidos()
      .filter(p => p.estado !== 'finished' && p.horaInicio)
      .sort((a, b) => new Date(a.horaInicio!).getTime() - new Date(b.horaInicio!).getTime())
  );

  readonly hayProximos = computed(() => this.proximos().length > 0);

  private readonly diasConPartido = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const p of this.liga.partidos()) {
      if (p.horaInicio) set.add(this.claveDia(new Date(p.horaInicio)));
    }
    return set;
  });

  readonly grupos = computed<IGrupoFecha[]>(() => {
    const sel = this.diaSeleccionado();
    const mapa = new Map<string, IGrupoFecha>();
    for (const p of this.proximos()) {
      const fecha = new Date(p.horaInicio!);
      const key = this.claveDia(fecha);
      if (sel && key !== sel) continue;
      if (!mapa.has(key)) {
        mapa.set(key, { key, label: this.etiquetaFecha(fecha), partidos: [] });
      }
      mapa.get(key)!.partidos.push(p);
    }
    return [...mapa.values()];
  });

  readonly etiquetaMes = computed(() =>
    new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.mesVisible())
  );

  readonly semanas = computed<ICeldaCalendario[][]>(() => {
    const base = this.mesVisible();
    const year = base.getFullYear();
    const month = base.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const dias = this.diasConPartido();
    const hoyKey = this.claveDia(new Date());
    const sel = this.diaSeleccionado();

    const semanas: ICeldaCalendario[][] = [];
    for (let w = 0; w < 6; w++) {
      const fila: ICeldaCalendario[] = [];
      for (let d = 0; d < 7; d++) {
        const fecha = new Date(year, month, 1 - offset + w * 7 + d);
        const key = this.claveDia(fecha);
        fila.push({
          dia: fecha.getDate(),
          key,
          enMes: fecha.getMonth() === month,
          conPartido: dias.has(key),
          esHoy: key === hoyKey,
          esSeleccionado: key === sel,
        });
      }
      semanas.push(fila);
    }
    return semanas;
  });

  mesAnterior(): void {
    const m = this.mesVisible();
    this.mesVisible.set(new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  mesSiguiente(): void {
    const m = this.mesVisible();
    this.mesVisible.set(new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  seleccionarDia(celda: ICeldaCalendario): void {
    if (!celda.conPartido) return;
    this.diaSeleccionado.set(this.diaSeleccionado() === celda.key ? null : celda.key);
  }

  limpiarSeleccion(): void { this.diaSeleccionado.set(null); }

  hora(iso: string | null): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }

  private primerDiaMes(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private claveDia(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private etiquetaFecha(d: Date): string {
    const txt = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }
}
