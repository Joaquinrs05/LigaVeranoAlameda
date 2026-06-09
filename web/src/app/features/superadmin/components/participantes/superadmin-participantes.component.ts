import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminLiga, AdminParticipante, SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-participantes',
  standalone: true,
  templateUrl: './superadmin-participantes.component.html',
  imports: [DecimalPipe],
})
export class SuperadminParticipantesComponent implements OnInit {
  private readonly svc = inject(SuperadminService);

  readonly ligas = signal<AdminLiga[]>([]);
  readonly ligaSeleccionada = signal<AdminLiga | null>(null);
  readonly participantes = signal<AdminParticipante[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.svc.getLigas().subscribe({ next: l => this.ligas.set(l) });
  }

  seleccionar(liga: AdminLiga): void {
    this.ligaSeleccionada.set(liga);
    this.cargando.set(true);
    this.svc.getParticipantes(liga.id).subscribe({
      next: p => { this.participantes.set(p); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar participantes'); this.cargando.set(false); },
    });
  }
}
