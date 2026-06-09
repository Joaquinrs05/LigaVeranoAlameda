import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminJornada, SuperadminService } from '../../../../core/services/superadmin.service';

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

  readonly finalizadas = () => this.jornadas().filter(j => j.estado === 'finalizada');

  ngOnInit(): void {
    this.svc.getJornadas().subscribe({ next: j => this.jornadas.set(j) });
  }

  seleccionar(j: AdminJornada): void {
    this.jornadaSeleccionada.set(j);
    this.resultado.set(null);
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
