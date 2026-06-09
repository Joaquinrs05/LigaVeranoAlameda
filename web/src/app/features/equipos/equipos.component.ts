import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { LigaRealService } from '../../core/services/liga-real.service';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink],
  templateUrl: './equipos.component.html',
})
export class EquiposComponent {
  private readonly liga = inject(LigaRealService);
  readonly equipos = this.liga.equipos;

  constructor() { this.liga.cargarEquipos(); }
}
