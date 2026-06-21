import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AudioService } from './core/services/audio.service';
import { ThemeService } from './core/services/theme.service';
import { SplashComponent } from './shared/components/splash/splash.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SplashComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly theme = inject(ThemeService);
  protected readonly audio = inject(AudioService);

  private readonly KEY = 'splash-visto';
  protected readonly mostrarSplash = signal(this.debeMostrar());

  protected cerrarSplash(): void {
    try { sessionStorage.setItem(this.KEY, '1'); } catch { /* no disponible */ }
    this.mostrarSplash.set(false);
  }

  private debeMostrar(): boolean {
    try { return sessionStorage.getItem(this.KEY) !== '1'; }
    catch { return true; }
  }
}
