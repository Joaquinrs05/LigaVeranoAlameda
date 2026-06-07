import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly email = signal('');
  readonly contrasena = signal('');
  readonly mostrarErrorEmail = signal(false);
  readonly mostrarErrorContrasena = signal(false);

  readonly cargando = this.auth.cargando;
  readonly error = this.auth.error;

  readonly emailValido = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email()));
  readonly contrasenaValida = computed(() => this.contrasena().length >= 6);
  readonly formularioValido = computed(() => this.emailValido() && this.contrasenaValida());

  constructor() {
    effect(() => {
      if (this.auth.autenticado()) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/fantasy/dashboard';
        this.router.navigateByUrl(returnUrl);
      }
    });
  }

  onBlurEmail(): void { this.mostrarErrorEmail.set(true); }
  onBlurContrasena(): void { this.mostrarErrorContrasena.set(true); }

  async submit(): Promise<void> {
    this.mostrarErrorEmail.set(true);
    this.mostrarErrorContrasena.set(true);
    if (!this.formularioValido()) return;
    await this.auth.loginConEmail({ email: this.email(), contrasena: this.contrasena() });
  }

  async loginGoogle(): Promise<void> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/fantasy/dashboard';
    await this.auth.loginConGoogle(returnUrl);
  }
}
