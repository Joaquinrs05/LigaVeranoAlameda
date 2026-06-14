import { Component, inject, input, signal } from '@angular/core';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { EntrenadorService } from '../../../../core/services/entrenador.service';
import { IEntrenadorEquipo } from '../../../../core/models/equipo-admin.model';

@Component({
  selector: 'app-equipo-admin-equipo',
  standalone: true,
  templateUrl: './equipo-admin-equipo.component.html',
})
export class EquipoAdminEquipoComponent {
  private readonly svc = inject(EntrenadorService);
  private readonly cloudinary = inject(CloudinaryService);

  readonly equipo  = input<IEntrenadorEquipo | null>(null);
  readonly equipoId = input<string | null>(null);

  readonly subiendo = signal(false);
  readonly exito    = signal<string | null>(null);
  readonly error    = signal<string | null>(null);
  readonly escudoUrl = signal<string | null>(null);

  onEscudo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const id = this.equipoId();
    const signatureBase = id ? this.svc.baseEquipo(id) : this.svc.base;

    this.subiendo.set(true);
    this.error.set(null);
    this.cloudinary.subirImagen(file, 'escudos', signatureBase).subscribe({
      next: url => {
        const patch$ = id
          ? this.svc.actualizarEquipoById(id, url)
          : this.svc.actualizarMiEquipo(url);

        patch$.subscribe({
          next: () => {
            this.escudoUrl.set(url);
            this.subiendo.set(false);
            this.flash('Escudo actualizado correctamente');
          },
          error: () => {
            this.error.set('Error al guardar el escudo');
            this.subiendo.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Error al subir la imagen');
        this.subiendo.set(false);
      },
    });
  }

  get urlActual(): string | null {
    return this.escudoUrl() ?? this.equipo()?.foto_url ?? null;
  }

  private flash(msg: string): void {
    this.exito.set(msg);
    setTimeout(() => this.exito.set(null), 3000);
  }
}
