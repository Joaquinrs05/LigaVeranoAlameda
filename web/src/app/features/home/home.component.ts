import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { PARTIDOS_DATA } from '../../core/data/partidos.data';
import { CLASIFICACION_DATA } from '../../core/data/clasificacion.data';
import { TOP_PERFORMERS, JORNADA_STATS, NOTICIA_BREAKING } from '../../core/data/jornada.data';
import { IPartido } from '../../core/models/partido.model';
import { IClasificacionEntry } from '../../core/models/clasificacion.model';
import { ITopPerformer } from '../../core/models/jugador.model';
import { IJornadaStats, INoticia } from '../../core/models/jornada.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarLightComponent, RouterLink, DecimalPipe],
  templateUrl: './home.component.html',
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('pointsDisplay') private pointsDisplayRef!: ElementRef<HTMLElement>;

  readonly partidos: IPartido[]            = PARTIDOS_DATA;
  readonly clasificacion: IClasificacionEntry[] = CLASIFICACION_DATA;
  readonly topPerformers: ITopPerformer[]  = TOP_PERFORMERS;
  readonly jornada: IJornadaStats          = JORNADA_STATS;
  readonly noticia: INoticia               = NOTICIA_BREAKING;

  ngAfterViewInit(): void {
    this.runEntryAnimation();
  }

  private runEntryAnimation(): void {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl
      // 1. Navbar y sidebar entran primero
      .from('[data-anim="navbar"]',    { y: -80,  opacity: 0, duration: 0.65 })
      .from('[data-anim="sidebar"]',   { x: -300, opacity: 0, duration: 0.65 }, '-=0.4')

      // 2. Cabecera de la primera sección
      .from('[data-anim="section-1-header"]', { y: 28, opacity: 0, duration: 0.45 }, '-=0.25')

      // 3. Cards de partidos en stagger
      .from('[data-anim="match-card"]', { y: 48, opacity: 0, duration: 0.45, stagger: 0.12 }, '-=0.2')

      // 4. Bento grid — izquierda y derecha con desfase
      .from('[data-anim="bento-left"]',  { y: 40, opacity: 0, duration: 0.5 }, '-=0.2')
      .from('[data-anim="bento-right"]', { y: 40, opacity: 0, duration: 0.5 }, '<0.12')

      // 5. Sección inferior
      .from('[data-anim="bottom-left"]',  { y: 32, opacity: 0, duration: 0.45 }, '-=0.25')
      .from('[data-anim="bottom-right"]', { y: 32, opacity: 0, duration: 0.45 }, '<0.1')
      .from('[data-anim="ranking-row"]',  { x: -18, opacity: 0, duration: 0.3, stagger: 0.07 }, '-=0.35')
      .from('[data-anim="performer"]',    { y: 20,  opacity: 0, duration: 0.35, stagger: 0.1 }, '<0.05');

    // Counter del marcador de la jornada
    const el = this.pointsDisplayRef?.nativeElement;
    if (el) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: this.jornada.puntos,
        duration: 1.8,
        delay: 0.85,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = String(Math.round(obj.val)); },
      });
    }
  }
}
