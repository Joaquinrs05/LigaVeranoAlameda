import { Component, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FantasyService } from '../../core/services/fantasy.service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

const PREFS_KEY = 'ajustes-liga-verano';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent],
  templateUrl: './ajustes.component.html',
})
export class AjustesComponent {
  private readonly fantasy = inject(FantasyService);
  private readonly auth    = inject(AuthService);
  private readonly router  = inject(Router);
  readonly theme = inject(ThemeService);

  readonly nombre       = signal('');
  readonly nombreEquipo = signal('');
  readonly email        = computed(() => this.auth.usuario()?.email ?? '');

  readonly notifJornada    = signal(true);
  readonly notifMercado    = signal(true);
  readonly notifAlineacion = signal(false);

  readonly guardando = signal(false);
  readonly guardado  = signal(false);
  readonly copiado   = signal(false);

  readonly enLiga            = this.fantasy.enLiga;
  readonly misLigas          = this.fantasy.misLigas;
  readonly ligaActiva        = this.fantasy.ligaActiva;
  readonly codigoInvitacion  = computed(() => this.fantasy.ligaActiva()?.codigo_invitacion ?? '');
  readonly confirmandoSalir  = signal(false);
  readonly saliendoDeLiga    = signal(false);

  readonly iniciales = computed(() => {
    const n = this.nombre().trim();
    if (!n) return '?';
    return n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  });

  readonly nombreValido     = computed(() => this.nombre().trim().length >= 2);
  readonly formularioValido = computed(() => this.nombreValido());

  constructor() {
    this.cargarPrefs();
    if (this.fantasy.misLigas().length === 0) {
      this.fantasy.inicializar();
    }
    effect(() => {
      const u = this.auth.usuario();
      if (u) {
        this.nombre.set(u.nombre);
        this.nombreEquipo.set(u.nombreEquipoFantasy ?? '');
      }
    });
  }

  private cargarPrefs(): void {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      this.notifJornada.set(d.notifJornada       ?? true);
      this.notifMercado.set(d.notifMercado       ?? true);
      this.notifAlineacion.set(d.notifAlineacion ?? false);
    } catch {
      // prefs corruptas — se ignoran y se usan los valores por defecto
    }
  }

  async guardar(): Promise<void> {
    if (!this.formularioValido()) return;
    this.guardando.set(true);

    localStorage.setItem(PREFS_KEY, JSON.stringify({
      notifJornada:    this.notifJornada(),
      notifMercado:    this.notifMercado(),
      notifAlineacion: this.notifAlineacion(),
    }));

    await this.auth.actualizarPerfil({
      nombre:              this.nombre().trim(),
      nombreEquipoFantasy: this.nombreEquipo().trim(),
    });

    this.guardando.set(false);
    this.guardado.set(true);
    setTimeout(() => this.guardado.set(false), 2000);
  }

  descartar(): void {
    const u = this.auth.usuario();
    if (u) {
      this.nombre.set(u.nombre);
      this.nombreEquipo.set(u.nombreEquipoFantasy ?? '');
    }
    this.cargarPrefs();
  }

  copiarEnlace(): void {
    const codigo = this.codigoInvitacion();
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).catch(() => {});
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2000);
  }

  toggleJornada(): void    { this.notifJornada.update(v => !v); }
  toggleMercado(): void    { this.notifMercado.update(v => !v); }
  toggleAlineacion(): void { this.notifAlineacion.update(v => !v); }

  onNombre(e: Event): void       { this.nombre.set((e.target as HTMLInputElement).value); }
  onNombreEquipo(e: Event): void { this.nombreEquipo.set((e.target as HTMLInputElement).value); }

  onSeleccionarLiga(e: Event): void {
    const id = (e.target as HTMLSelectElement).value;
    const liga = this.misLigas().find(l => l.id === id);
    if (liga && liga.id !== this.ligaActiva()?.id) {
      this.fantasy.seleccionarLiga(liga);
    }
  }

  async confirmarSalirDeLiga(): Promise<void> {
    this.saliendoDeLiga.set(true);
    try {
      await this.fantasy.salirDeLiga();
      this.router.navigate(['/fantasy']);
    } finally {
      this.saliendoDeLiga.set(false);
      this.confirmandoSalir.set(false);
    }
  }
}
