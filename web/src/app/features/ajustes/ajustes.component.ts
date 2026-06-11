import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FantasyService } from '../../core/services/fantasy.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent],
  templateUrl: './ajustes.component.html',
})
export class AjustesComponent {
  private readonly fantasy = inject(FantasyService);
  private readonly router  = inject(Router);
  readonly tema = inject(ThemeService);
  readonly nombre        = signal('');
  readonly email         = signal('');
  readonly nombreEquipo  = signal('');

  readonly notifJornada    = signal(true);
  readonly notifMercado    = signal(true);
  readonly notifAlineacion = signal(false);

  readonly privacidad = signal('publica');

  readonly guardando = signal(false);
  readonly guardado  = signal(false);
  readonly copiado   = signal(false);

  readonly enLiga            = this.fantasy.enLiga;
  readonly nombreLiga        = this.fantasy.ligaActiva;
  readonly confirmandoSalir  = signal(false);
  readonly saliendoDeLiga    = signal(false);

  readonly iniciales = computed(() => {
    const n = this.nombre().trim();
    if (!n) return '?';
    return n.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  });

  readonly nombreValido     = computed(() => this.nombre().trim().length >= 2);
  readonly emailValido      = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()));
  readonly formularioValido = computed(() => this.nombreValido() && this.emailValido());

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    try {
      const raw = localStorage.getItem('ajustes-liga-verano');
      if (raw) {
        const d = JSON.parse(raw);
        this.nombre.set(d.nombre             ?? 'Jugador Fantasy');
        this.email.set(d.email              ?? 'jugador@liga-verano.es');
        this.nombreEquipo.set(d.nombreEquipo ?? 'Los Cañoneros');
        this.notifJornada.set(d.notifJornada    ?? true);
        this.notifMercado.set(d.notifMercado    ?? true);
        this.notifAlineacion.set(d.notifAlineacion ?? false);
        this.privacidad.set(d.privacidad     ?? 'publica');
      } else {
        this.nombre.set('Jugador Fantasy');
        this.email.set('jugador@liga-verano.es');
        this.nombreEquipo.set('Los Cañoneros');
      }
    } catch {
      this.nombre.set('Jugador Fantasy');
      this.email.set('jugador@liga-verano.es');
      this.nombreEquipo.set('Los Cañoneros');
    }
  }

  guardar(): void {
    if (!this.formularioValido()) return;
    this.guardando.set(true);
    localStorage.setItem('ajustes-liga-verano', JSON.stringify({
      nombre:          this.nombre(),
      email:           this.email(),
      nombreEquipo:    this.nombreEquipo(),
      notifJornada:    this.notifJornada(),
      notifMercado:    this.notifMercado(),
      notifAlineacion: this.notifAlineacion(),
      privacidad:      this.privacidad(),
    }));
    setTimeout(() => {
      this.guardando.set(false);
      this.guardado.set(true);
      setTimeout(() => this.guardado.set(false), 2000);
    }, 600);
  }

  descartar(): void {
    this.cargar();
  }

  copiarEnlace(): void {
    navigator.clipboard.writeText('liga-alameda.es/invite/alameda26').catch(() => {});
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2000);
  }

  toggleJornada(): void    { this.notifJornada.update(v => !v); }
  toggleMercado(): void    { this.notifMercado.update(v => !v); }
  toggleAlineacion(): void { this.notifAlineacion.update(v => !v); }

  onNombre(e: Event): void       { this.nombre.set((e.target as HTMLInputElement).value); }
  onEmail(e: Event): void        { this.email.set((e.target as HTMLInputElement).value); }
  onNombreEquipo(e: Event): void { this.nombreEquipo.set((e.target as HTMLInputElement).value); }
  onPrivacidad(e: Event): void   { this.privacidad.set((e.target as HTMLSelectElement).value); }

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
