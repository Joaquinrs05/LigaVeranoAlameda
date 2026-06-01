import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar-light',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar-light.component.html',
})
export class NavbarLightComponent {}
