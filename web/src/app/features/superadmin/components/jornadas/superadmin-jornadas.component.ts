import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminJornada, SuperadminService } from '../../../../core/services/superadmin.service';

@Component({
  selector: 'app-superadmin-jornadas',
  standalone: true,
  templateUrl: './superadmin-jornadas.component.html',
  imports: [FormsModule],
})
export class SuperadminJornadasComponent implements OnInit {
  private readonly svc = inject(SuperadminService);

  readonly jornadas = signal<AdminJornada[]>([]);
  readonly cargando = signal(false);
  readonly mostrarFormulario = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly hayEnCurso = computed(() => this.jornadas().some(j => j.estado === 'en_curso'));

  nuevaJornada = { numero: 1, fecha_inicio: '', fecha_fin: '' };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.getJornadas().subscribe({
      next: j => { this.jornadas.set(j); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar jornadas'); this.cargando.set(false); },
    });
  }

  crear(): void {
    if (!this.nuevaJornada.fecha_inicio || !this.nuevaJornada.fecha_fin) return;
    this.svc.crearJornada(this.nuevaJornada).subscribe({
      next: j => {
        this.jornadas.update(list => [...list, j].sort((a, b) => a.numero - b.numero));
        this.mostrarFormulario.set(false);
        this.nuevaJornada = { numero: this.jornadas().length + 1, fecha_inicio: '', fecha_fin: '' };
        this.flash('Jornada creada');
      },
      error: () => this.error.set('Error al crear jornada'),
    });
  }

  cambiarEstado(jornada: AdminJornada, nuevoEstado: string): void {
    this.svc.actualizarJornada(jornada.id, { estado: nuevoEstado }).subscribe({
      next: j => this.actualizarLocal(j),
      error: () => this.error.set('Error al cambiar estado'),
    });
  }

  toggleMercado(jornada: AdminJornada): void {
    this.svc.actualizarJornada(jornada.id, { mercado_activo: !jornada.mercado_activo }).subscribe({
      next: j => this.actualizarLocal(j),
      error: () => this.error.set('Error al cambiar mercado'),
    });
  }

  private actualizarLocal(updated: AdminJornada): void {
    this.jornadas.update(list => list.map(j => j.id === updated.id ? updated : j));
  }

  private flash(msg: string): void {
    this.exito.set(msg);
    setTimeout(() => this.exito.set(null), 3000);
  }
}
