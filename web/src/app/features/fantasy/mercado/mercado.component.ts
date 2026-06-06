import { Component, signal, computed } from '@angular/core';
import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { MI_EQUIPO_FANTASY, CATALOGO_MERCADO } from '../../../core/data/fantasy.data';
import { IJugadorFantasy } from '../../../core/models/fantasy.model';

type PosicionFiltro = 'todos' | IJugadorFantasy['posicion'];

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent],
  templateUrl: './mercado.component.html',
})
export class MercadoComponent {
  readonly filtrosPosicion: Array<{ valor: PosicionFiltro; etiqueta: string }> = [
    { valor: 'todos',          etiqueta: 'Todos' },
    { valor: 'portero',        etiqueta: 'POR'   },
    { valor: 'defensa',        etiqueta: 'DEF'   },
    { valor: 'centrocampista', etiqueta: 'MC'    },
    { valor: 'delantero',      etiqueta: 'DEL'   },
  ];

  readonly posicion    = signal<PosicionFiltro>('todos');
  readonly busqueda    = signal('');
  readonly presupuesto = signal(MI_EQUIPO_FANTASY.presupuesto);

  private readonly equipoJugadores = signal([...MI_EQUIPO_FANTASY.jugadores]);

  readonly idsEnEquipo = computed(() => new Set(this.equipoJugadores().map(j => j.id)));

  readonly jugadoresFiltrados = computed(() => {
    const pos = this.posicion();
    const q   = this.busqueda().trim().toLowerCase();
    return CATALOGO_MERCADO.filter(j =>
      (pos === 'todos' || j.posicion === pos) &&
      (q === '' || j.nombre.toLowerCase().includes(q) || j.equipo.toLowerCase().includes(q))
    );
  });

  filtrarPosicion(pos: PosicionFiltro): void {
    this.posicion.set(pos);
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  fichar(jugador: IJugadorFantasy): void {
    if (this.idsEnEquipo().has(jugador.id)) return;
    if (jugador.estado !== 'disponible') return;
    if (this.presupuesto() < jugador.precio) return;
    this.equipoJugadores.update(lista => [...lista, { ...jugador, titular: false }]);
    this.presupuesto.update(p => Math.round((p - jugador.precio) * 10) / 10);
  }

  posicionAbrev(pos: IJugadorFantasy['posicion']): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  posicionColor(pos: IJugadorFantasy['posicion']): string {
    return { portero: '#1a4a2e', defensa: '#c0552a', centrocampista: '#0f5a8a', delantero: '#7b2d8b' }[pos];
  }
}
