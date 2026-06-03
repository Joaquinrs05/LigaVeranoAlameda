import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';

@Component({
  selector: 'app-equipo-detalle',
  standalone: true,
  imports: [NavbarLightComponent, RouterLink],
  template: `
    <app-navbar-light />
    <main class="pt-24 pb-xl md:pl-70 px-margin-mobile md:pr-margin-desktop min-h-screen max-w-[1440px] mx-auto">
      <p class="text-headline-md font-semibold text-primary">Detalle de equipo — pendiente implementar (spec 07)</p>
      <a routerLink="/equipos" class="text-body-md text-on-background/60 underline mt-md inline-block">← Volver a equipos</a>
    </main>
  `,
})
export class EquipoDetalleComponent {}
