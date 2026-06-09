import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NavbarLightComponent } from '../../../shared/components/navbar/navbar-light/navbar-light.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FantasyService, ApiLiga } from '../../../core/services/fantasy.service';

@Component({
  selector: 'app-mis-ligas',
  standalone: true,
  imports: [NavbarLightComponent, FooterComponent, FormsModule],
  templateUrl: './mis-ligas.component.html',
})
export class MisLigasComponent implements OnInit {
  private readonly fantasy = inject(FantasyService);
  private readonly router  = inject(Router);

  readonly ligas      = this.fantasy.misLigas;
  readonly ligaActiva = this.fantasy.ligaActiva;
  readonly cargando   = this.fantasy.cargando;

  readonly modo       = signal<'idle' | 'crear' | 'unirse'>('idle');
  readonly copiado    = signal<string | null>(null);
  readonly errorMsg   = signal<string | null>(null);
  readonly guardando  = signal(false);
  readonly codigoGenerado = signal<string | null>(null);

  nombreLiga    = '';
  nombreEquipo  = '';
  codigoUnirse  = '';
  nombreEquipoUnirse = '';

  ngOnInit(): void {
    this.fantasy.inicializar();
  }

  esActiva(liga: ApiLiga): boolean {
    return this.ligaActiva()?.id === liga.id;
  }

  seleccionar(liga: ApiLiga): void {
    this.fantasy.seleccionarLiga(liga);
    this.router.navigate(['/fantasy/dashboard']);
  }

  copiar(codigo: string): void {
    navigator.clipboard.writeText(codigo).then(() => {
      this.copiado.set(codigo);
      setTimeout(() => this.copiado.set(null), 2000);
    });
  }

  async crear(): Promise<void> {
    if (!this.nombreLiga.trim() || !this.nombreEquipo.trim()) return;
    this.errorMsg.set(null);
    this.guardando.set(true);
    try {
      const codigo = await this.fantasy.crearLiga(this.nombreLiga.trim(), this.nombreEquipo.trim());
      this.codigoGenerado.set(codigo);
      this.fantasy.inicializar();
      this.nombreLiga = '';
      this.nombreEquipo = '';
    } catch {
      this.errorMsg.set('Error al crear la liga. Inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  async unirse(): Promise<void> {
    if (!this.codigoUnirse.trim() || !this.nombreEquipoUnirse.trim()) return;
    this.errorMsg.set(null);
    this.guardando.set(true);
    try {
      await this.fantasy.unirseALiga(this.codigoUnirse.trim().toUpperCase(), this.nombreEquipoUnirse.trim());
      this.fantasy.inicializar();
      this.modo.set('idle');
      this.codigoUnirse = '';
      this.nombreEquipoUnirse = '';
    } catch {
      this.errorMsg.set('Código inválido o ya eres miembro de esta liga.');
    } finally {
      this.guardando.set(false);
    }
  }
}
