import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, signal, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LigaRealService } from '../../core/services/liga-real.service';
import { IClasificacionEntry } from '../../core/models/clasificacion.model';
import { ICruce, FaseTorneo } from '../../core/models/torneo.model';

const FASES: { tipo: FaseTorneo; label: string }[] = [
  { tipo: 'liguilla', label: 'Liguilla' },
  { tipo: 'cuartos',  label: 'Cuartos'  },
  { tipo: 'semis',    label: 'Semis'    },
  { tipo: 'final',    label: 'Final'    },
];

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, NgTemplateOutlet],
  templateUrl: './clasificacion.component.html',
})
export class ClasificacionComponent implements OnInit, AfterViewInit {
  @ViewChild('contenido') private contenidoRef!: ElementRef<HTMLElement>;

  private readonly ligaReal = inject(LigaRealService);

  readonly fases      = FASES;
  readonly faseActiva = signal<FaseTorneo>('liguilla');

  // Getters: Angular rastrea lecturas de signals dentro de getters en templates
  get clasificacion(): IClasificacionEntry[] { return this.ligaReal.clasificacion(); }
  get cuartos(): ICruce[]      { return this.ligaReal.cruces().cuartos; }
  get semis(): ICruce[]        { return this.ligaReal.cruces().semis; }
  get finalMatch(): ICruce | null { return this.ligaReal.cruces().final; }

  ngOnInit(): void {
    this.ligaReal.cargarClasificacion();
    this.ligaReal.cargarCruces();
  }

  ngAfterViewInit(): void {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('[data-anim="header"]',  { y: 20, opacity: 0, duration: 0.4 })
      .from('[data-anim="tabs"]',    { y: -15, opacity: 0, duration: 0.35 }, '-=0.15')
      .from('[data-anim="content"]', { y: 24, opacity: 0, duration: 0.4 }, '-=0.1');
  }

  setFase(tipo: FaseTorneo): void {
    if (tipo === this.faseActiva()) return;
    const prevIdx = FASES.findIndex(f => f.tipo === this.faseActiva());
    const nextIdx = FASES.findIndex(f => f.tipo === tipo);
    const dir     = nextIdx > prevIdx ? 1 : -1;
    const el      = this.contenidoRef.nativeElement;

    gsap.to(el, {
      x: dir * -30, opacity: 0, duration: 0.18, ease: 'power2.in',
      onComplete: () => {
        this.faseActiva.set(tipo);
        gsap.fromTo(el,
          { x: dir * 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out' },
        );
      },
    });
  }

  get crucesActivos(): ICruce[] {
    switch (this.faseActiva()) {
      case 'cuartos': return this.cuartos;
      case 'semis':   return this.semis;
      case 'final':   { const f = this.finalMatch; return f ? [f] : []; }
      default:        return [];
    }
  }

  isWinner(cruce: ICruce, lado: 'local' | 'visitante'): boolean {
    if (cruce.estado !== 'finished' || cruce.golesLocal === null || cruce.golesVisitante === null) return false;
    return lado === 'local'
      ? cruce.golesLocal > cruce.golesVisitante
      : cruce.golesVisitante > cruce.golesLocal;
  }

  abrev(nombre: string): string {
    return nombre.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  }
}
