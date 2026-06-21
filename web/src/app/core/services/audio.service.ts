import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly KEY = 'himno-silenciado';
  private audio?: HTMLAudioElement;

  readonly silenciado = signal<boolean>(this.leerInicial());
  readonly activo = signal(false);

  // Debe llamarse dentro de un gesto del usuario (clic) para saltar el bloqueo de autoplay.
  activar(): void {
    if (!this.audio) {
      this.audio = new Audio('/himno-malaga.mp3');
      this.audio.loop = true;
      this.audio.volume = 0.5;
    }
    this.activo.set(true);
    this.sincronizar();
  }

  toggleSilencio(): void {
    this.silenciado.update(s => !s);
    this.guardar();
    this.sincronizar();
  }

  private sincronizar(): void {
    if (!this.audio) return;
    if (this.silenciado()) {
      this.audio.pause();
    } else {
      void this.audio.play().catch(() => { /* el navegador puede bloquearlo */ });
    }
  }

  private leerInicial(): boolean {
    try {
      return localStorage.getItem(this.KEY) === '1';
    } catch {
      return false;
    }
  }

  private guardar(): void {
    try {
      localStorage.setItem(this.KEY, this.silenciado() ? '1' : '0');
    } catch { /* localStorage no disponible */ }
  }
}
