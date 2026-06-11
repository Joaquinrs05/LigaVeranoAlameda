import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LigaRealService } from '../../core/services/liga-real.service';
import { IPartido } from '../../core/models/partido.model';
import { IClasificacionEntry } from '../../core/models/clasificacion.model';
import { IGoleadorJornada } from '../../core/models/jugador.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('cardsTrack') private cardsTrackRef!: ElementRef<HTMLElement>;

  private readonly ligaReal = inject(LigaRealService);

  // Getters: leen signals — Angular los rastrea para change detection
  get partidos(): IPartido[] {
    const lista = this.ligaReal.partidos();
    return [...lista, ...lista];
  }

  get goleadores(): IGoleadorJornada[] {
    return this.ligaReal.goleadores();
  }

  get partidoDestacado(): IPartido {
    const lista = this.ligaReal.partidos();
    return lista.find(p => p.estado === 'live')
        ?? lista.find(p => p.estado === 'upcoming')
        ?? lista[0]
        ?? { id: '', equipoLocal: '—', abrevLocal: '—', equipoVisitante: '—', abrevVisitante: '—', golesLocal: null, golesVisitante: null, minuto: null, estado: 'upcoming', horaInicio: null };
  }

  // Jornada número desde la primera jornada activa
  get jornadaNumero(): number {
    return this.ligaReal.jornadaActual();
  }

  readonly totalEquipos = computed(() => this.ligaReal.clasificacion().length);
  readonly mostrarTodosClasificacion = signal(false);

  readonly clasificacionVisible = computed<IClasificacionEntry[]>(() => {
    const all = this.ligaReal.clasificacion();
    return (this.mostrarTodosClasificacion() || all.length <= 6) ? all : all.slice(0, 6);
  });

  readonly totalGoleadores = computed(() => this.ligaReal.goleadores().length);
  readonly mostrarTodosGoleadores = signal(false);

  readonly goleadoresVisible = computed<IGoleadorJornada[]>(() => {
    const all = this.ligaReal.goleadores();
    return (this.mostrarTodosGoleadores() || all.length <= 5) ? all : all.slice(0, 5);
  });

  ngOnInit(): void {
    this.ligaReal.cargarClasificacion();
    this.ligaReal.cargarPartidos();
    this.ligaReal.cargarGoleadores();
  }

  ngAfterViewInit(): void {
    this.runEntryAnimation();
  }

  pauseScroll(): void  { this.cardsTrackRef.nativeElement.style.animationPlayState = 'paused'; }
  resumeScroll(): void { this.cardsTrackRef.nativeElement.style.animationPlayState = 'running'; }

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
