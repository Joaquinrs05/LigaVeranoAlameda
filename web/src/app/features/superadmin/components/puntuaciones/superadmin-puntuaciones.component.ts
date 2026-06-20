import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminJornada, AdminPartidoResumen, SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-puntuaciones',
  standalone: true,
  templateUrl: './superadmin-puntuaciones.component.html',
})
export class SuperadminPuntuacionesComponent implements OnInit {
  private readonly svc = inject(SuperadminService);

  readonly jornadas = signal<AdminJornada[]>([]);
  readonly jornadaSeleccionada = signal<AdminJornada | null>(null);
  readonly calculando = signal(false);
  readonly resultado = signal<{ miembros_calculados: number; jornada: number } | null>(null);
  readonly error = signal<string | null>(null);
  readonly mostrarBaremo = signal(false);
  readonly resumen = signal<AdminPartidoResumen[]>([]);
  readonly cargandoResumen = signal(false);

  readonly baremo: { concepto: string; puntos: string }[] = [
    { concepto: 'Su equipo gana el partido', puntos: '+3' },
    { concepto: 'Su equipo empata', puntos: '+1' },
    { concepto: 'Gol', puntos: '+2' },
    { concepto: 'Portería a cero (portero y defensa)', puntos: '+2' },
    { concepto: 'Portería a cero (centrocampista y delantero)', puntos: '+1' },
    { concepto: 'Tarjeta amarilla', puntos: '−1' },
    { concepto: 'Tarjeta roja', puntos: '−2' },
  ];

  readonly finalizadas = () => this.jornadas().filter(j => j.estado === 'finalizada');

  ngOnInit(): void {
    this.svc.getJornadas().subscribe({ next: j => this.jornadas.set(j) });
  }

  seleccionar(j: AdminJornada): void {
    this.jornadaSeleccionada.set(j);
    this.resultado.set(null);
    this.resumen.set([]);
    this.cargandoResumen.set(true);
    this.svc.getResumenPuntuaciones(j.numero).subscribe({
      next: r => { this.resumen.set(r?.partidos ?? []); this.cargandoResumen.set(false); },
      error: () => { this.cargandoResumen.set(false); },
    });
  }

  eventosEquipo(p: AdminPartidoResumen, equipoId: string | null): AdminPartidoResumen['eventos'] {
    return p.eventos.filter(e => e.equipo_id === equipoId);
  }

  calcular(): void {
    const j = this.jornadaSeleccionada();
    if (!j) return;
    this.calculando.set(true);
    this.error.set(null);
    this.svc.calcularPuntuaciones(j.numero).subscribe({
      next: r => { this.resultado.set(r); this.calculando.set(false); },
      error: () => { this.error.set('Error al calcular puntuaciones'); this.calculando.set(false); },
    });
  }
}
