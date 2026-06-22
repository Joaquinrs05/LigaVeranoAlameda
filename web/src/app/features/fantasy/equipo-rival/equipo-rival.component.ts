import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { PlayerCardComponent } from '../../../shared/components/player-card/player-card.component';
import { FantasyService } from '../../../core/services/fantasy.service';
import { IJugadorFantasy } from '../../../core/models/fantasy.model';

@Component({
  selector: 'app-equipo-rival',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, PlayerCardComponent, RouterLink, DecimalPipe],
  templateUrl: './equipo-rival.component.html',
})
export class EquipoRivalComponent implements OnInit {
  private readonly fantasy = inject(FantasyService);
  private readonly route   = inject(ActivatedRoute);

  readonly miembroId   = signal<string>('');
  readonly jugadores   = signal<IJugadorFantasy[]>([]);
  readonly cargando    = signal(true);
  readonly detalle     = signal<IJugadorFantasy | null>(null);
  readonly confirmando = signal(false);
  readonly procesando  = signal(false);
  readonly error       = signal<string | null>(null);

  readonly titulares = computed(() => this.jugadores().filter(j => j.titular));
  readonly reservas  = computed(() => this.jugadores().filter(j => !j.titular));

  readonly porteros        = computed(() => this.titulares().filter(j => j.posicion === 'portero'));
  readonly defensas        = computed(() => this.titulares().filter(j => j.posicion === 'defensa'));
  readonly centrocampistas = computed(() => this.titulares().filter(j => j.posicion === 'centrocampista'));
  readonly delanteros      = computed(() => this.titulares().filter(j => j.posicion === 'delantero'));

  // Datos del rival tomados de la clasificación ya cargada.
  readonly info = computed(() =>
    this.fantasy.clasificacion().find(c => c.miembroId === this.miembroId()) ?? null
  );
  readonly miPresupuesto = computed(() => this.fantasy.miembro()?.presupuesto ?? 0);

  readonly puedePagar = computed(() => {
    const j = this.detalle();
    return j ? (j.clausula ?? 0) <= this.miPresupuesto() : false;
  });

  constructor() {
    // En cuanto la liga esté activa y tengamos el miembro, cargar su plantilla.
    effect(() => {
      const ligaId = this.fantasy.ligaId();
      const mid    = this.miembroId();
      if (ligaId && mid) this._cargar(mid);
    });
  }

  ngOnInit(): void {
    this.miembroId.set(this.route.snapshot.paramMap.get('miembroId') ?? '');
    if (!this.fantasy.enLiga()) this.fantasy.inicializar();
  }

  private async _cargar(mid: string): Promise<void> {
    this.cargando.set(true);
    try {
      this.jugadores.set(await this.fantasy.verEquipoMiembro(mid));
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(j: IJugadorFantasy): void {
    this.detalle.set(j);
    this.confirmando.set(false);
    this.error.set(null);
  }

  cerrar(): void {
    this.detalle.set(null);
    this.confirmando.set(false);
    this.error.set(null);
  }

  async confirmarClausulazo(): Promise<void> {
    const j = this.detalle();
    if (!j || this.procesando()) return;
    this.procesando.set(true);
    this.error.set(null);
    try {
      await this.fantasy.clausulazo(j.id);
      await this._cargar(this.miembroId());
      this.cerrar();
    } catch (e) {
      this.error.set(this._msgError(e));
    } finally {
      this.procesando.set(false);
    }
  }

  private _msgError(e: unknown): string {
    const err = e as { error?: { detail?: string } };
    return err?.error?.detail ?? 'No se pudo completar el cláusulazo. Inténtalo de nuevo.';
  }

  primerNombre(nombre: string): string { return nombre.split(' ')[0]; }
  iniciales(nombre: string): string    { return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase(); }

  posicionColor(pos: IJugadorFantasy['posicion']): string {
    return { portero: '#1a4a2e', defensa: '#c0552a', centrocampista: '#0f5a8a', delantero: '#7b2d8b' }[pos];
  }

  posicionAbrev(pos: IJugadorFantasy['posicion']): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }
}
