import { Component, OnInit, signal, computed, inject, effect, untracked } from '@angular/core';
import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FantasyService } from '../../../core/services/fantasy.service';
import { IJugadorFantasy } from '../../../core/models/fantasy.model';

type PosicionFiltro = 'todos' | IJugadorFantasy['posicion'];

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent],
  templateUrl: './mercado.component.html',
})
export class MercadoComponent implements OnInit {
  constructor() {
    // Carga el mercado cuando ligaId esté disponible (maneja navegación directa a /mercado)
    effect(() => {
      if (this.fantasy.ligaId()) {
        untracked(() => this.fantasy.cargarMercado());
      }
    });
  }

  readonly filtrosPosicion: Array<{ valor: PosicionFiltro; etiqueta: string }> = [
    { valor: 'todos',          etiqueta: 'Todos' },
    { valor: 'portero',        etiqueta: 'POR'   },
    { valor: 'defensa',        etiqueta: 'DEF'   },
    { valor: 'centrocampista', etiqueta: 'MC'    },
    { valor: 'delantero',      etiqueta: 'DEL'   },
  ];

  readonly fantasy    = inject(FantasyService);
  readonly posicion   = signal<PosicionFiltro>('todos');
  readonly busqueda   = signal('');
  readonly presupuesto = this.fantasy.presupuesto;

  readonly idsEnEquipo = computed(() =>
    new Set(this.fantasy.miEquipo().map(j => j.id))
  );

  readonly jugadoresFiltrados = computed<IJugadorFantasy[]>(() => {
    const pos = this.posicion();
    const q   = this.busqueda().trim().toLowerCase();
    return this.fantasy.mercado().filter(j =>
      (pos === 'todos' || j.posicion === pos) &&
      (q === '' || j.nombre.toLowerCase().includes(q) || j.equipo.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    if (!this.fantasy.enLiga()) {
      this.fantasy.inicializar();
    }
  }

  filtrarPosicion(pos: PosicionFiltro): void {
    this.posicion.set(pos);
  }

  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  async fichar(jugador: IJugadorFantasy): Promise<void> {
    if (this.idsEnEquipo().has(jugador.id)) return;
    if (jugador.estado !== 'disponible') return;
    if (this.presupuesto() < jugador.precio) return;
    await this.fantasy.ficharJugador(jugador.id);
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
