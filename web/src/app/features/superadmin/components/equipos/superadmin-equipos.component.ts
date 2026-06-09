import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminEquipo, SuperadminService } from '../../../../core/services/superadmin.service';

interface EquipoEditable extends AdminEquipo {
  editando: boolean;
  nombreEdit: string;
  escudoEdit: string;
  entrenadorEdit: string;
}

@Component({
  selector: 'app-superadmin-equipos',
  standalone: true,
  templateUrl: './superadmin-equipos.component.html',
  imports: [FormsModule],
})
export class SuperadminEquiposComponent implements OnInit {
  private readonly svc = inject(SuperadminService);

  readonly equipos = signal<EquipoEditable[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);
  readonly mostrarFormulario = signal(false);

  nuevoEquipo = { nombre: '', escudo_url: '' };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.getEquipos().subscribe({
      next: lista => {
        this.equipos.set(lista.map(e => this.toEditable(e)));
        this.cargando.set(false);
      },
      error: () => { this.error.set('Error al cargar equipos'); this.cargando.set(false); },
    });
  }

  crear(): void {
    if (!this.nuevoEquipo.nombre) return;
    const body: { nombre: string; escudo_url?: string } = { nombre: this.nuevoEquipo.nombre };
    if (this.nuevoEquipo.escudo_url) body.escudo_url = this.nuevoEquipo.escudo_url;
    this.svc.crearEquipo(body).subscribe({
      next: e => {
        this.equipos.update(list => [...list, this.toEditable(e)]);
        this.mostrarFormulario.set(false);
        this.nuevoEquipo = { nombre: '', escudo_url: '' };
        this.flash('Equipo creado');
      },
      error: () => this.error.set('Error al crear equipo'),
    });
  }

  editar(e: EquipoEditable): void {
    e.editando = true;
  }

  guardar(e: EquipoEditable): void {
    const body: Partial<Pick<AdminEquipo, 'nombre' | 'escudo_url' | 'entrenador_id'>> = {};
    if (e.nombreEdit !== e.nombre) body.nombre = e.nombreEdit;
    if (e.escudoEdit !== (e.escudo_url ?? '')) body.escudo_url = e.escudoEdit || null;
    if (e.entrenadorEdit !== (e.entrenador_id ?? '')) body.entrenador_id = e.entrenadorEdit || null;

    if (Object.keys(body).length === 0) { e.editando = false; return; }

    this.svc.actualizarEquipo(e.id, body).subscribe({
      next: updated => {
        this.equipos.update(list => list.map(x => x.id === updated.id ? { ...this.toEditable(updated), editando: false } : x));
        this.flash('Guardado');
      },
      error: () => this.error.set('Error al guardar equipo'),
    });
  }

  cancelar(e: EquipoEditable): void {
    e.editando = false;
    e.nombreEdit = e.nombre;
    e.escudoEdit = e.escudo_url ?? '';
    e.entrenadorEdit = e.entrenador_id ?? '';
  }

  private toEditable(e: AdminEquipo): EquipoEditable {
    return { ...e, editando: false, nombreEdit: e.nombre, escudoEdit: e.escudo_url ?? '', entrenadorEdit: e.entrenador_id ?? '' };
  }

  private flash(msg: string): void {
    this.exito.set(msg);
    setTimeout(() => this.exito.set(null), 3000);
  }
}
