import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminJornada, AdminPartido, SuperadminService } from '../../../../core/services/superadmin.service';

interface PartidoEditable extends AdminPartido {
  golesLocalEdit: number;
  golesVisitanteEdit: number;
  guardado: boolean;
}

@Component({
  selector: 'app-superadmin-resultados',
  standalone: true,
  templateUrl: './superadmin-resultados.component.html',
  imports: [FormsModule],
})
export class SuperadminResultadosComponent implements OnInit {
  private readonly svc = inject(SuperadminService);

  readonly jornadas = signal<AdminJornada[]>([]);
  readonly partidos = signal<PartidoEditable[]>([]);
  readonly jornadaSeleccionada = signal<AdminJornada | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
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
    this.cargando.set(true);
    this.svc.getPartidos(jornada.id).subscribe({
      next: lista => {
        this.partidos.set(lista.map(p => ({
          ...p,
          golesLocalEdit: p.goles_local ?? 0,
          golesVisitanteEdit: p.goles_visitante ?? 0,
          guardado: false,
        })));
        this.cargando.set(false);
      },
      error: () => { this.error.set('Error al cargar partidos'); this.cargando.set(false); },
    });
  }

  guardarPartido(p: PartidoEditable): void {
    this.svc.actualizarPartido(p.id, { goles_local: p.golesLocalEdit, goles_visitante: p.golesVisitanteEdit }).subscribe({
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
}
