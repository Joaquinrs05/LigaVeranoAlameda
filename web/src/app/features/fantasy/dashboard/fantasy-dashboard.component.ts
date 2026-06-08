import { Component, ViewChild, ElementRef, AfterViewInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { MI_EQUIPO_FANTASY, CLASIFICACION_FANTASY } from '../../../core/data/fantasy.data';
import { PARTIDOS_DATA } from '../../../core/data/partidos.data';
import { IEquipoFantasy, IJugadorFantasy, IClasificacionFantasy } from '../../../core/models/fantasy.model';
import { IPartido } from '../../../core/models/partido.model';

@Component({
  selector: 'app-fantasy-dashboard',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink, FormsModule],
  templateUrl: './fantasy-dashboard.component.html',
})
export class FantasyDashboardComponent implements AfterViewInit {
  @ViewChild('cardsTrack') private cardsTrackRef!: ElementRef<HTMLElement>;

  readonly enLiga = signal(false);

  readonly equipo: IEquipoFantasy                      = MI_EQUIPO_FANTASY;
  readonly clasificacion: IClasificacionFantasy[]      = CLASIFICACION_FANTASY;
  readonly partidos: IPartido[]                        = [...PARTIDOS_DATA, ...PARTIDOS_DATA];

  readonly titulares: IJugadorFantasy[]  = this.equipo.jugadores.filter(j => j.titular);
  readonly reservas: IJugadorFantasy[]   = this.equipo.jugadores.filter(j => !j.titular);

  readonly mostrarTodaClasificacion = signal(false);
  readonly clasificacionVisible     = computed(() =>
    this.mostrarTodaClasificacion() ? this.clasificacion : this.clasificacion.slice(0, 5)
  );

  readonly mostrarTodosJugadores = signal(false);
  readonly jugadoresVisibles     = computed(() =>
    this.mostrarTodosJugadores() ? this.titulares : this.titulares.slice(0, 5)
  );

  readonly posicionLabel: string = (() => {
    const pos = this.equipo.posicionLiga;
    if (pos === 1) return '1º';
    if (pos === 2) return '2º';
    if (pos === 3) return '3º';
    return `${pos}º`;
  })();

  // Empty-state: crear / unirse
  readonly modoOnboarding = signal<'idle' | 'crear' | 'unirse'>('idle');
  nombreLigaNueva = '';
  codigoInvitacion = '';

  crearLiga(): void {
    if (!this.nombreLigaNueva.trim()) return;
    // Mock: la liga queda creada y el usuario entra
    this.enLiga.set(true);
  }

  unirseALiga(): void {
    if (!this.codigoInvitacion.trim()) return;
    // Mock: se valida el código y el usuario entra
    this.enLiga.set(true);
  }

  ngAfterViewInit(): void {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('[data-anim="hero"]',          { y: 40,  opacity: 0, duration: 0.6 })
      .from('[data-anim="partidos"]',      { y: 24,  opacity: 0, duration: 0.45 }, '-=0.2')
      .from('[data-anim="jugadores"]',     { y: 28,  opacity: 0, duration: 0.45 }, '-=0.15')
      .from('[data-anim="clasificacion"]', { y: 28,  opacity: 0, duration: 0.4  }, '<0.08');
  }

  pauseScroll(): void  { this.cardsTrackRef.nativeElement.style.animationPlayState = 'paused'; }
  resumeScroll(): void { this.cardsTrackRef.nativeElement.style.animationPlayState = 'running'; }

  posicionAbrev(pos: IJugadorFantasy['posicion']): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }
}
