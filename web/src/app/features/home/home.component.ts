import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { PARTIDOS_DATA } from '../../core/data/partidos.data';
import { CLASIFICACION_DATA } from '../../core/data/clasificacion.data';
import { GOLEADORES_JORNADA } from '../../core/data/jornada.data';
import { IPartido } from '../../core/models/partido.model';
import { IClasificacionEntry } from '../../core/models/clasificacion.model';
import { IGoleadorJornada } from '../../core/models/jugador.model';

const SCROLL_SPEED  = 0.6;
const JORNADA_NUMERO = 12;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarLightComponent, RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cardsScroll') private cardsScrollRef!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private rafId?: number;

  readonly partidos: IPartido[]                 = [...PARTIDOS_DATA, ...PARTIDOS_DATA];
  readonly clasificacion: IClasificacionEntry[] = CLASIFICACION_DATA;
  readonly goleadores: IGoleadorJornada[]       = GOLEADORES_JORNADA;
  readonly jornadaNumero                        = JORNADA_NUMERO;

  ngAfterViewInit(): void {
    this.runEntryAnimation();
  }

  ngOnDestroy(): void {
    this.stopScroll();
  }

  pauseScroll(): void  { this.stopScroll(); }
  resumeScroll(): void { this.startScroll(); }

  scrollCards(dir: 1 | -1): void {
    const el = this.cardsScrollRef.nativeElement;
    const card = el.firstElementChild as HTMLElement;
    if (!card) return;
    el.scrollLeft += dir * (card.offsetWidth + 16);
  }

  private runEntryAnimation(): void {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('[data-anim="partidos-header"]', { y: -20, opacity: 0, duration: 0.5 })
      .from('[data-anim="cards-scroll"]',    { y: 36, opacity: 0, duration: 0.55 }, '-=0.2')
      .from('[data-anim="clasificacion"]',   { y: 28, opacity: 0, duration: 0.45 }, '-=0.15')
      .from('[data-anim="goleadores"]',      { y: 28, opacity: 0, duration: 0.45 }, '<0.08')
      .call(() => this.startScroll());
  }

  private readonly tick = (): void => {
    const el = this.cardsScrollRef.nativeElement;
    const halfway = el.scrollWidth / 2;
    if (el.scrollLeft >= halfway) {
      el.scrollLeft -= halfway;
    } else {
      el.scrollLeft += SCROLL_SPEED;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };

  private startScroll(): void {
    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.tick);
    });
  }

  private stopScroll(): void {
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }
}
