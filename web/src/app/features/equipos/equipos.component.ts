import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LigaRealService } from '../../core/services/liga-real.service';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent],
  templateUrl: './equipos.component.html',
})
export class EquiposComponent {
  private readonly liga = inject(LigaRealService);
  private readonly router = inject(Router);

  readonly equipos = this.liga.equipos;
  readonly activeIndex = signal(0);
  private readonly fotosFallidas = signal<Set<string>>(new Set());
  readonly equipoActivo = computed(() => this.equipos()[this.activeIndex()] ?? null);

  constructor() { this.liga.cargarEquipos(); }

  tieneFoto(id: string, fotoUrl?: string | null): boolean {
    return !!fotoUrl && !this.fotosFallidas().has(id);
  }

  marcarFallo(id: string): void {
    this.fotosFallidas.update(s => new Set(s).add(id));
  }

  prev(): void { this.irA(this.activeIndex() - 1); }
  next(): void { this.irA(this.activeIndex() + 1); }

  @HostListener('window:keydown.arrowleft')
  onArrowLeft(): void { this.prev(); }

  @HostListener('window:keydown.arrowright')
  onArrowRight(): void { this.next(); }

  private touchStartX = 0;
  private wheelLock = false;

  onTouchStart(e: TouchEvent): void { this.touchStartX = e.changedTouches[0].clientX; }

  onTouchEnd(e: TouchEvent): void {
    const delta = e.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(delta) < 40) return;
    delta < 0 ? this.next() : this.prev();
  }

  onWheel(e: WheelEvent): void {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 10 || this.wheelLock) return;
    e.preventDefault();
    this.wheelLock = true;
    delta > 0 ? this.next() : this.prev();
    setTimeout(() => (this.wheelLock = false), 350);
  }

  irA(i: number): void {
    const n = this.equipos().length;
    if (n === 0) return;
    this.activeIndex.set(((i % n) + n) % n);
  }

  // Offset circular respecto al centro: hace que el carrusel sea un bucle.
  private offset(index: number): number {
    const n = this.equipos().length;
    let off = index - this.activeIndex();
    if (off > n / 2) off -= n;
    if (off < -n / 2) off += n;
    return off;
  }

  cardStyle(index: number): Record<string, string> {
    const off = this.offset(index);
    const abs = Math.abs(off);

    if (abs > 2) {
      return {
        transform: `translateX(calc(-50% + ${off * 300}px)) scale(0.4) rotateY(${off * -12}deg)`,
        opacity: '0',
        zIndex: '0',
        'pointer-events': 'none',
      };
    }

    const translate = off * 190;
    const scale = 1 - abs * 0.18;
    const rotateY = off * -10;

    return {
      transform: `translateX(calc(-50% + ${translate}px)) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity: `${1 - abs * 0.3}`,
      zIndex: `${10 - abs}`,
    };
  }

  esActivo(index: number): boolean { return this.offset(index) === 0; }

  onCardClick(index: number): void {
    if (this.esActivo(index)) this.verDetalle();
    else this.irA(index);
  }

  verDetalle(): void {
    const e = this.equipoActivo();
    if (e) this.router.navigate(['/equipos', e.id]);
  }
}
