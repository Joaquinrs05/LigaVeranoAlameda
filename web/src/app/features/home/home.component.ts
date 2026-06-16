import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
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
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('scroller') private scrollerRef!: ElementRef<HTMLElement>;

  private readonly ligaReal = inject(LigaRealService);

  // Slide activo del carrusel de "Partido del Día" — rota cada 3s
  readonly slideActual = signal(0);
  private slideTimer?: ReturnType<typeof setInterval>;

  private readonly partidoFallback: IPartido = {
    id: '', equipoLocal: '—', abrevLocal: '—', colorLocal: '#C0552A',
    equipoVisitante: '—', abrevVisitante: '—', colorVisitante: '#1A4A2E',
    golesLocal: null, golesVisitante: null, minuto: null, estado: 'upcoming', horaInicio: null,
  };

  get goleadores(): IGoleadorJornada[] {
    return this.ligaReal.goleadores();
  }

  // Todos los partidos de la semana del partido ancla, duplicados para el scroll infinito
  get partidosSemana(): IPartido[] {
    const porHora = this.partidosOrdenados();
    if (!porHora.length) return [];
    const ancla = this.partidoAncla(porHora);
    const semana = this.semanaKey(ancla?.horaInicio ?? null);
    return porHora.filter(p => this.semanaKey(p.horaInicio) === semana);
  }

  get partidosSemanaLoop(): IPartido[] {
    const lista = this.partidosSemana;
    return [...lista, ...lista];
  }

  // Todos los partidos del día destacado (en vivo > próximo más cercano > último jugado)
  get partidosDelDia(): IPartido[] {
    const porHora = this.partidosOrdenados();
    if (!porHora.length) return [];
    const ancla = this.partidoAncla(porHora);
    const dia = this.diaKey(ancla?.horaInicio ?? null);
    return porHora.filter(p => this.diaKey(p.horaInicio) === dia);
  }

  get partidoDestacado(): IPartido {
    const dia = this.partidosDelDia;
    if (!dia.length) return this.partidoFallback;
    return dia[this.slideActual() % dia.length];
  }

  // Hora local del partido en formato HH:MM
  horaPartido(partido: IPartido): string {
    if (!partido.horaInicio) return '';
    const fecha = new Date(partido.horaInicio);
    if (Number.isNaN(fecha.getTime())) return partido.horaInicio;
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  // Día abreviado + hora, ej. "MIÉ 20:30"
  diaHora(partido: IPartido): string {
    if (!partido.horaInicio) return '';
    const fecha = new Date(partido.horaInicio);
    if (Number.isNaN(fecha.getTime())) return partido.horaInicio;
    const dia = fecha.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
    return `${dia} ${this.horaPartido(partido)}`;
  }

  private partidosOrdenados(): IPartido[] {
    return [...this.ligaReal.partidos()]
      .sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? ''));
  }

  private partidoAncla(porHora: IPartido[]): IPartido | undefined {
    return porHora.find(p => p.estado === 'live')
        ?? porHora.find(p => p.estado === 'upcoming')
        ?? porHora.at(-1);
  }

  private diaKey(iso: string | null): string {
    if (!iso) return '';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return iso;
    return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
  }

  // Clave de la semana (lunes) que contiene la fecha dada
  private semanaKey(iso: string | null): string {
    if (!iso) return '';
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return iso;
    const diaSemana = (fecha.getDay() + 6) % 7; // lunes = 0
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - diaSemana);
    return `${lunes.getFullYear()}-${lunes.getMonth()}-${lunes.getDate()}`;
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

    this.slideTimer = setInterval(() => {
      const total = this.partidosDelDia.length;
      if (total > 1) this.slideActual.update(i => (i + 1) % total);
    }, 5000);
  }

  ngAfterViewInit(): void {
    this.runEntryAnimation();
    this.autoScroll();
  }

  ngOnDestroy(): void {
    if (this.slideTimer) clearInterval(this.slideTimer);
    if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
  }

  // ── Carrusel: auto-scroll por JS + arrastre con dedo/ratón ──
  private rafId?: number;
  private autoPaused = true;
  private arrastrando = false;
  private dragInicioX = 0;
  private dragInicioScroll = 0;

  pauseScroll(): void  { this.autoPaused = true; }
  resumeScroll(): void { this.autoPaused = false; }

  private autoScroll(): void {
    const el = this.scrollerRef.nativeElement;
    const paso = () => {
      if (!this.autoPaused && el.scrollWidth > el.clientWidth) {
        const mitad = (el.scrollWidth + 16) / 2; // 16 = gap-md entre las dos copias
        el.scrollLeft += 0.45;
        if (el.scrollLeft >= mitad) el.scrollLeft -= mitad;
      }
      this.rafId = requestAnimationFrame(paso);
    };
    this.rafId = requestAnimationFrame(paso);
  }

  onPointerDown(e: PointerEvent): void {
    this.pauseScroll();
    if (e.pointerType !== 'mouse') return; // el táctil usa el scroll nativo
    const el = this.scrollerRef.nativeElement;
    this.arrastrando = true;
    this.dragInicioX = e.clientX;
    this.dragInicioScroll = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.arrastrando) return;
    this.scrollerRef.nativeElement.scrollLeft = this.dragInicioScroll - (e.clientX - this.dragInicioX);
  }

  onPointerUp(): void {
    this.arrastrando = false;
    this.resumeScroll();
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
