import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  readonly tema = inject(ThemeService);
}
