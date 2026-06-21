import { AfterViewInit, Component, ElementRef, inject, output, viewChild } from '@angular/core';
import { gsap } from 'gsap';

import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.component.html',
})
export class SplashComponent implements AfterViewInit {
  private readonly audio = inject(AudioService);

  private readonly overlay = viewChild.required<ElementRef<HTMLElement>>('overlay');
  private readonly escudo = viewChild.required<ElementRef<HTMLElement>>('escudo');
  private readonly somos = viewChild.required<ElementRef<HTMLElement>>('somos');
  private readonly boton = viewChild.required<ElementRef<HTMLElement>>('boton');

  readonly cerrado = output<void>();

  ngAfterViewInit(): void {
    gsap
      .timeline()
      .from(this.escudo().nativeElement, {
        opacity: 0,
        scale: 0.5,
        duration: 1,
        ease: 'back.out(1.7)',
      })
      .from(
        this.somos().nativeElement,
        { opacity: 0, x: 40, duration: 0.6, ease: 'power2.out' },
        '-=0.4',
      )
      .from(
        this.boton().nativeElement,
        { opacity: 0, y: 24, duration: 0.5, ease: 'power2.out' },
        '-=0.2',
      );
  }

  entrar(): void {
    // El audio debe activarse de forma síncrona dentro del clic (gesto del usuario).
    this.audio.activar();
    gsap.to(this.overlay().nativeElement, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => this.cerrado.emit(),
    });
  }
}
