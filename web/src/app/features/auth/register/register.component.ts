import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly nombre = signal('');
  readonly email = signal('');
  readonly contrasena = signal('');
  readonly confirmarContrasena = signal('');

  readonly mostrarErrorNombre = signal(false);
  readonly mostrarErrorEmail = signal(false);
  readonly mostrarErrorContrasena = signal(false);
  readonly mostrarErrorConfirmar = signal(false);

  readonly cargando = this.auth.cargando;
  readonly error = this.auth.error;

  readonly nombreValido = computed(() => this.nombre().trim().length >= 2);
  readonly emailValido = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()));
  readonly contrasenaValida = computed(() => this.contrasena().length >= 6);
  readonly contrasenasCoincidenValido = computed(() =>
    this.contrasena() === this.confirmarContrasena() && this.confirmarContrasena().length > 0
  );
  readonly formularioValido = computed(() =>
    this.nombreValido() && this.emailValido() && this.contrasenaValida() && this.contrasenasCoincidenValido()
  );

  constructor() {
    effect(() => {
      if (this.auth.autenticado()) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/fantasy/dashboard';
        this.router.navigateByUrl(returnUrl);
      }
    });
  }

  onBlurNombre(): void { this.mostrarErrorNombre.set(true); }
  onBlurEmail(): void { this.mostrarErrorEmail.set(true); }
  onBlurContrasena(): void { this.mostrarErrorContrasena.set(true); }
  onBlurConfirmar(): void { this.mostrarErrorConfirmar.set(true); }

  async submit(): Promise<void> {
    this.mostrarErrorNombre.set(true);
    this.mostrarErrorEmail.set(true);
    this.mostrarErrorContrasena.set(true);
    this.mostrarErrorConfirmar.set(true);
    if (!this.formularioValido()) return;
    await this.auth.registrarConEmail({
      nombre: this.nombre().trim(),
      email: this.email(),
      contrasena: this.contrasena(),
      confirmarContrasena: this.confirmarContrasena(),
    });
  }

  async loginGoogle(): Promise<void> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/fantasy/dashboard';
    await this.auth.loginConGoogle(returnUrl);
  }
}
