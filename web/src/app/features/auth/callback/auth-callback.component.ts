import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/fantasy/dashboard';

    // El SDK de Supabase procesa el hash de la URL automáticamente al inicializarse.
    // onAuthStateChange en AuthService actualiza el signal usuario cuando el intercambio completa.
    setTimeout(() => {
      if (this.auth.autenticado()) {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.error.set('No se pudo completar la autenticación con Google. Inténtalo de nuevo.');
      }
    }, 1500);
  }
}
