import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { EntrenadorService } from '../../../../core/services/entrenador.service';
import { IEntrenadorJugador } from '../../../../core/models/equipo-admin.model';

const POSICIONES = ['portero', 'defensa', 'centrocampista', 'delantero'] as const;

interface JugadorEdit {
  nombre: string;
  dorsal: number | null;
  posicion: string;
}

@Component({
  selector: 'app-equipo-admin-plantilla',
  standalone: true,
  templateUrl: './equipo-admin-plantilla.component.html',
  imports: [FormsModule],
})
export class EquipoAdminPlantillaComponent implements OnInit {
  private readonly svc = inject(EntrenadorService);
  private readonly cloudinary = inject(CloudinaryService);

  readonly posiciones = POSICIONES;
  readonly jugadores = signal<IEntrenadorJugador[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  // Edits locales pendientes de guardar (nombre y dorsal)
  readonly edits = signal<Record<string, JugadorEdit>>({});
  // Jugadores con cambios pendientes (nombre/dorsal)
  readonly sucios = signal<Set<string>>(new Set());
  // Jugadores subiendo foto
  readonly subiendoFoto = signal<Record<string, boolean>>({});
  // Jugadores guardando cambios
  readonly guardando = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.getJugadores().subscribe({
      next: jugadores => {
        this.jugadores.set(jugadores);
        // Inicializar edits con los valores actuales
        const editsMap: Record<string, JugadorEdit> = {};
        for (const j of jugadores) {
          editsMap[j.id] = { nombre: j.nombre, dorsal: j.dorsal, posicion: j.posicion };
        }
        this.edits.set(editsMap);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar la plantilla');
        this.cargando.set(false);
      },
    });
  }

  onCampoTexto(jugadorId: string): void {
    this.sucios.update(s => new Set([...s, jugadorId]));
  }

  onPosicionCambia(jugadorId: string, posicion: string): void {
    this.edits.update(m => ({ ...m, [jugadorId]: { ...m[jugadorId], posicion } }));
    this.guardando.update(m => ({ ...m, [jugadorId]: true }));
    this.svc.actualizarJugador(jugadorId, { posicion }).subscribe({
      next: updated => {
        this.actualizarLocal(updated);
        this.guardando.update(m => ({ ...m, [jugadorId]: false }));
        this.flash('Posición actualizada');
      },
      error: () => {
        this.error.set('Error al actualizar posición');
        this.guardando.update(m => ({ ...m, [jugadorId]: false }));
      },
    });
  }

  toggleTitular(jugador: IEntrenadorJugador): void {
    const es_titular = !jugador.es_titular;
    this.guardando.update(m => ({ ...m, [jugador.id]: true }));
    this.svc.actualizarJugador(jugador.id, { es_titular }).subscribe({
      next: updated => {
        this.actualizarLocal(updated);
        this.guardando.update(m => ({ ...m, [jugador.id]: false }));
        this.flash(es_titular ? 'Marcado como titular' : 'Movido a suplente');
      },
      error: () => {
        this.error.set('Error al actualizar');
        this.guardando.update(m => ({ ...m, [jugador.id]: false }));
      },
    });
  }

  guardarJugador(jugadorId: string): void {
    const edit = this.edits()[jugadorId];
    if (!edit) return;

    this.guardando.update(m => ({ ...m, [jugadorId]: true }));
    this.svc.actualizarJugador(jugadorId, { nombre: edit.nombre, dorsal: edit.dorsal ?? undefined }).subscribe({
      next: updated => {
        this.actualizarLocal(updated);
        this.sucios.update(s => { const next = new Set(s); next.delete(jugadorId); return next; });
        this.guardando.update(m => ({ ...m, [jugadorId]: false }));
        this.flash('Jugador actualizado');
      },
      error: () => {
        this.error.set('Error al guardar cambios');
        this.guardando.update(m => ({ ...m, [jugadorId]: false }));
      },
    });
  }

  onFoto(event: Event, jugador: IEntrenadorJugador): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.subiendoFoto.update(m => ({ ...m, [jugador.id]: true }));
    this.cloudinary.subirImagen(file, 'jugadores', this.svc.base).subscribe({
      next: url => {
        this.svc.actualizarJugador(jugador.id, { foto_url: url }).subscribe({
          next: updated => {
            this.actualizarLocal(updated);
            this.subiendoFoto.update(m => ({ ...m, [jugador.id]: false }));
            this.flash('Foto actualizada');
          },
          error: () => {
            this.error.set('Error al guardar la foto');
            this.subiendoFoto.update(m => ({ ...m, [jugador.id]: false }));
          },
        });
      },
      error: () => {
        this.error.set('Error al subir la foto');
        this.subiendoFoto.update(m => ({ ...m, [jugador.id]: false }));
      },
    });
  }

  esSucio(jugadorId: string): boolean {
    return this.sucios().has(jugadorId);
  }

  private actualizarLocal(updated: IEntrenadorJugador): void {
    this.jugadores.update(list => list.map(j => j.id === updated.id ? updated : j));
    this.edits.update(m => ({
      ...m,
      [updated.id]: { nombre: updated.nombre, dorsal: updated.dorsal, posicion: updated.posicion },
    }));
  }

  private flash(msg: string): void {
    this.error.set(null);
    this.exito.set(msg);
    setTimeout(() => this.exito.set(null), 3000);
  }
}
