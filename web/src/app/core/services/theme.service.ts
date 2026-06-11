import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY = 'liga-tema-oscuro';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly oscuro = signal(this._leerPreferencia());

  constructor() {
    effect(() => {
      this._aplicar(this.oscuro());
    });
  }

  alternar(): void {
    this.establecer(!this.oscuro());
  }

  establecer(oscuro: boolean): void {
    this.oscuro.set(oscuro);
    localStorage.setItem(STORAGE_KEY, String(oscuro));
  }

  private _leerPreferencia(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }

  private _aplicar(oscuro: boolean): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', oscuro);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', oscuro ? '#083725' : '#075530');
  }
}
