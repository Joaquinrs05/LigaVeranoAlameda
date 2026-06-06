import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { EQUIPOS_DATA } from '../../core/data/equipos.data';
import { IEquipo } from '../../core/models/equipo.model';

@Component({
  selector: 'app-equipos',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink],
  templateUrl: './equipos.component.html',
})
export class EquiposComponent {
  readonly equipos: IEquipo[] = EQUIPOS_DATA;
}
