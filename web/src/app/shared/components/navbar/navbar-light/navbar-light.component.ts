import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-navbar-light',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar-light.component.html',
})
export class NavbarLightComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly router = inject(Router);

  readonly fantasyMenuAbierto = signal(false);
  readonly perfilModalAbierto = signal(false);

  toggleFantasyMenu(): void {
    this.fantasyMenuAbierto.update(v => !v);
  }

  cerrarFantasyMenu(): void {
    this.fantasyMenuAbierto.set(false);
  }

  togglePerfilModal(): void {
    this.perfilModalAbierto.update(v => !v);
  }

  cerrarPerfilModal(): void {
    this.perfilModalAbierto.set(false);
  }

  irAjustes(): void {
    this.router.navigate(['/ajustes']);
    this.cerrarPerfilModal();
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.cerrarPerfilModal();
  }
}
