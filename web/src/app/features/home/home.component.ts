import { Component, ViewChild, ElementRef, AfterViewInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { PARTIDOS_DATA } from '../../core/data/partidos.data';
import { CLASIFICACION_DATA } from '../../core/data/clasificacion.data';
import { GOLEADORES_JORNADA } from '../../core/data/jornada.data';
import { IPartido } from '../../core/models/partido.model';
import { IClasificacionEntry } from '../../core/models/clasificacion.model';
import { IGoleadorJornada } from '../../core/models/jugador.model';

const JORNADA_NUMERO = 12;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarLightComponent, RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('cardsTrack') private cardsTrackRef!: ElementRef<HTMLElement>;

  readonly partidos: IPartido[]                 = [...PARTIDOS_DATA, ...PARTIDOS_DATA];
  readonly clasificacion: IClasificacionEntry[] = CLASIFICACION_DATA;
  readonly goleadores: IGoleadorJornada[]       = GOLEADORES_JORNADA;

  readonly mostrarTodosClasificacion = signal(false);
  readonly clasificacionVisible = computed(() =>
    this.mostrarTodosClasificacion() ? this.clasificacion : this.clasificacion.slice(0, 6)
  );
  readonly jornadaNumero                        = JORNADA_NUMERO;
  readonly partidoDestacado: IPartido           =
    PARTIDOS_DATA.find(p => p.estado === 'live') ??
    PARTIDOS_DATA.find(p => p.estado === 'upcoming') ??
    PARTIDOS_DATA[0];

  ngAfterViewInit(): void {
    this.runEntryAnimation();
  }

  pauseScroll(): void {
    this.cardsTrackRef.nativeElement.style.animationPlayState = 'paused';
  }

  resumeScroll(): void {
    this.cardsTrackRef.nativeElement.style.animationPlayState = 'running';
  }

  private runEntryAnimation(): void {
    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .from('[data-anim="match-hero"]',      { y: 40, opacity: 0, duration: 0.6 })
      .from('[data-anim="partidos-header"]', { y: -20, opacity: 0, duration: 0.45 }, '-=0.2')
      .from('[data-anim="cards-scroll"]',    { y: 32, opacity: 0, duration: 0.5 }, '-=0.2')
      .from('[data-anim="clasificacion"]',   { y: 28, opacity: 0, duration: 0.45 }, '-=0.15')
      .from('[data-anim="goleadores"]',      { y: 28, opacity: 0, duration: 0.45 }, '<0.08')
      .call(() => this.resumeScroll());
  }
}
