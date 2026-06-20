import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FantasyService } from '../../../core/services/fantasy.service';
import { LigaRealService } from '../../../core/services/liga-real.service';
import { IJugadorFantasy } from '../../../core/models/fantasy.model';
import { IPartido } from '../../../core/models/partido.model';

@Component({
  selector: 'app-fantasy-dashboard',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink, FormsModule],
  templateUrl: './fantasy-dashboard.component.html',
})
export class FantasyDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('cardsTrack') private cardsTrackRef!: ElementRef<HTMLElement>;

  readonly fantasy   = inject(FantasyService);
  private readonly ligaReal = inject(LigaRealService);

  readonly enLiga        = this.fantasy.enLiga;
  readonly cargando      = this.fantasy.cargando;
  readonly clasificacion = this.fantasy.clasificacion;
  readonly miembro       = this.fantasy.miembro;

  // Getters: Angular rastrea lecturas de signals en templates sin necesitar ()
  get jornadaNumero(): number {
    return this.ligaReal.jornadaActual();
  }

  // Partidos de la semana del partido ancla (en vivo > próximo > último), duplicados para el scroll.
  get partidos(): IPartido[] {
    const semana = this.partidosSemana();
    return [...semana, ...semana];
  }

  private partidosSemana(): IPartido[] {
    const porHora = [...this.ligaReal.partidos()]
      .sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? ''));
    if (!porHora.length) return [];
    const ancla = porHora.find(p => p.estado === 'live')
      ?? porHora.find(p => p.estado === 'upcoming')
      ?? porHora.at(-1);
    const semana = this.semanaKey(ancla?.horaInicio ?? null);
    return porHora.filter(p => this.semanaKey(p.horaInicio) === semana);
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

  get equipo(): { nombre: string; puntuacionJornada: number; puntuacionTotal: number; presupuesto: number } {
    const m = this.fantasy.miembro();
    return {
      nombre:            m?.nombre_equipo ?? 'Mi Equipo',
      puntuacionJornada: 0,
      puntuacionTotal:   m?.puntos_total  ?? 0,
      presupuesto:       m?.presupuesto   ?? 50,
    };
  }

  get posicionLabel(): string {
    const pos = this.fantasy.clasificacion().find(c => c.esUsuario)?.posicion ?? 0;
    return pos ? `${pos}º` : '—';
  }

  readonly titulares = computed<IJugadorFantasy[]>(() =>
    this.fantasy.miEquipo().filter(j => j.titular)
  );
  readonly reservas = computed<IJugadorFantasy[]>(() =>
    this.fantasy.miEquipo().filter(j => !j.titular)
  );

  readonly mostrarTodaClasificacion = signal(false);
  readonly clasificacionVisible = computed(() =>
    this.mostrarTodaClasificacion() ? this.clasificacion() : this.clasificacion().slice(0, 5)
  );

  readonly mostrarTodosJugadores = signal(false);
  readonly jugadoresVisibles = computed(() =>
    this.mostrarTodosJugadores() ? this.titulares() : this.titulares().slice(0, 5)
  );

  readonly codigoCopiado = signal(false);

  copiarCodigo(): void {
    const codigo = this.fantasy.ligaActiva()?.codigo_invitacion;
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).then(() => {
      this.codigoCopiado.set(true);
      setTimeout(() => this.codigoCopiado.set(false), 2000);
    });
  }

  // Empty-state: crear / unirse
  readonly modoOnboarding = signal<'idle' | 'crear' | 'unirse'>('idle');
  readonly codigoGenerado  = signal<string | null>(null);
  readonly errorMsg        = signal<string | null>(null);
  nombreLigaNueva  = '';
  nombreEquipoNuevo = '';
  codigoInvitacion = '';
  nombreEquipo     = '';

  ngOnInit(): void {
    this.ligaReal.cargarPartidos();
    this.fantasy.inicializar();
  }

  ngAfterViewInit(): void {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('[data-anim="hero"]',          { y: 40,  opacity: 0, duration: 0.6 })
      .from('[data-anim="partidos"]',      { y: 24,  opacity: 0, duration: 0.45 }, '-=0.2')
      .from('[data-anim="jugadores"]',     { y: 28,  opacity: 0, duration: 0.45 }, '-=0.15')
      .from('[data-anim="clasificacion"]', { y: 28,  opacity: 0, duration: 0.4  }, '<0.08');
  }

  async crearLiga(): Promise<void> {
    if (!this.nombreLigaNueva.trim() || !this.nombreEquipoNuevo.trim()) return;
    this.errorMsg.set(null);
    try {
      const codigo = await this.fantasy.crearLiga(
        this.nombreLigaNueva.trim(),
        this.nombreEquipoNuevo.trim()
      );
      this.codigoGenerado.set(codigo);
      this.fantasy.inicializar();
    } catch {
      this.errorMsg.set('Error al crear la liga. Inténtalo de nuevo.');
    }
  }

  async unirseALiga(): Promise<void> {
    if (!this.codigoInvitacion.trim() || !this.nombreEquipo.trim()) return;
    this.errorMsg.set(null);
    try {
      await this.fantasy.unirseALiga(this.codigoInvitacion.trim(), this.nombreEquipo.trim());
      this.fantasy.inicializar();
    } catch {
      this.errorMsg.set('Código inválido o ya eres miembro de esta liga.');
    }
  }

  pauseScroll(): void  { this.cardsTrackRef.nativeElement.style.animationPlayState = 'paused'; }
  resumeScroll(): void { this.cardsTrackRef.nativeElement.style.animationPlayState = 'running'; }

  posicionAbrev(pos: IJugadorFantasy['posicion']): string {
    return { portero: 'POR', defensa: 'DEF', centrocampista: 'MC', delantero: 'DEL' }[pos];
  }
}
