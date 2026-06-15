import { Injectable, effect, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'tema-liga-verano';
  readonly tema = signal<Tema>(this.leerInicial());

  constructor() {
    this.aplicar(this.tema());
    effect(() => this.aplicar(this.tema()));
  }

  toggle(): void { this.tema.update(t => (t === 'oscuro' ? 'claro' : 'oscuro')); }
  set(tema: Tema): void { this.tema.set(tema); }

  private leerInicial(): Tema {
    try {
      const guardado = localStorage.getItem(this.KEY);
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    } catch { /* localStorage no disponible */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }

  private aplicar(tema: Tema): void {
    document.documentElement.classList.toggle('dark', tema === 'oscuro');
    try { localStorage.setItem(this.KEY, tema); } catch { /* ignore */ }
  }
}
