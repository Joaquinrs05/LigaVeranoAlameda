import { Component, ViewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { gsap } from 'gsap';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CLASIFICACION_DATA } from '../../core/data/clasificacion.data';
import { TORNEO_DATA } from '../../core/data/torneo.data';
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
export class ClasificacionComponent implements AfterViewInit {
  @ViewChild('contenido') private contenidoRef!: ElementRef<HTMLElement>;

  readonly fases                                = FASES;
  readonly clasificacion: IClasificacionEntry[] = CLASIFICACION_DATA;
  readonly faseActiva                           = signal<FaseTorneo>('liguilla');

  readonly cuartos:    ICruce[]      = TORNEO_DATA.find(f => f.tipo === 'cuartos')?.cruces  ?? [];
  readonly semis:      ICruce[]      = TORNEO_DATA.find(f => f.tipo === 'semis')?.cruces    ?? [];
  readonly finalMatch: ICruce | null = TORNEO_DATA.find(f => f.tipo === 'final')?.cruces?.[0] ?? null;

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
      case 'final':   return this.finalMatch ? [this.finalMatch] : [];
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
