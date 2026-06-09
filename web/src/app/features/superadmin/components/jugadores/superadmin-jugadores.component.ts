import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminEquipo, AdminJugador, SuperadminService } from '../../../../core/services/superadmin.service';

const POSICIONES = ['portero', 'defensa', 'centrocampista', 'delantero'];
const ESTADOS = ['disponible', 'lesionado', 'sancionado'];

@Component({
  selector: 'app-superadmin-jugadores',
  standalone: true,
  templateUrl: './superadmin-jugadores.component.html',
  imports: [FormsModule],
})
export class SuperadminJugadoresComponent implements OnInit {
  private readonly svc = inject(SuperadminService);

  readonly posiciones = POSICIONES;
  readonly estados = ESTADOS;

  readonly jugadores = signal<AdminJugador[]>([]);
  readonly equipos = signal<AdminEquipo[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  readonly busqueda = signal('');
  readonly filtroEquipo = signal('');
  readonly filtroPosicion = signal('');
  readonly mostrarFormulario = signal(false);

  readonly jugadoresFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    const eq = this.filtroEquipo();
    const pos = this.filtroPosicion();
    return this.jugadores().filter(j =>
      (!q || j.nombre.toLowerCase().includes(q)) &&
      (!eq || j.equipo_id === eq) &&
      (!pos || j.posicion === pos)
    );
  });

  nuevoJugador = { equipo_id: '', nombre: '', dorsal: undefined as number | undefined, posicion: 'delantero', precio_fantasy: 5 };

  ngOnInit(): void {
    this.cargar();
    this.svc.getEquipos().subscribe({ next: e => this.equipos.set(e) });
  }

  cargar(): void {
    this.cargando.set(true);
    this.svc.getJugadores().subscribe({
      next: j => { this.jugadores.set(j); this.cargando.set(false); },
      error: () => { this.error.set('Error al cargar jugadores'); this.cargando.set(false); },
    });
  }

  crear(): void {
    if (!this.nuevoJugador.equipo_id || !this.nuevoJugador.nombre) return;
    this.svc.crearJugador(this.nuevoJugador).subscribe({
      next: j => {
        this.jugadores.update(list => [...list, j]);
        this.mostrarFormulario.set(false);
        this.nuevoJugador = { equipo_id: '', nombre: '', dorsal: undefined, posicion: 'delantero', precio_fantasy: 5 };
        this.flash('Jugador creado');
      },
      error: () => this.error.set('Error al crear jugador'),
    });
  }

  cambiarEstado(j: AdminJugador, estado: string): void {
    this.svc.actualizarJugador(j.id, { estado_fantasy: estado }).subscribe({
      next: updated => this.actualizarLocal(updated),
      error: () => this.error.set('Error al actualizar estado'),
    });
  }

  cambiarPrecio(j: AdminJugador, precio: number): void {
    this.svc.actualizarJugador(j.id, { precio_fantasy: precio }).subscribe({
      next: updated => this.actualizarLocal(updated),
    });
  }

  darDeBaja(j: AdminJugador): void {
    if (!confirm(`¿Dar de baja a ${j.nombre}?`)) return;
    this.svc.darDeBaja(j.id).subscribe({
      next: updated => this.actualizarLocal(updated),
      error: () => this.error.set('Error al dar de baja'),
    });
  }

  private actualizarLocal(updated: AdminJugador): void {
    this.jugadores.update(list => list.map(j => j.id === updated.id ? updated : j));
  }

  private flash(msg: string): void {
    this.exito.set(msg);
    setTimeout(() => this.exito.set(null), 3000);
  }
}
