import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FantasyService } from '../../../core/services/fantasy.service';

@Component({
  selector: 'app-fantasy-clasificacion',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, RouterLink],
  templateUrl: './fantasy-clasificacion.component.html',
})
export class FantasyClasificacionComponent {
  readonly fantasy = inject(FantasyService);

  readonly enLiga       = this.fantasy.enLiga;
  readonly cargando     = this.fantasy.cargando;
  readonly clasificacion = this.fantasy.clasificacion;

  readonly top3 = computed(() => this.clasificacion().slice(0, 3));
  readonly resto = computed(() => this.clasificacion().slice(3));
}
