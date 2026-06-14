import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { EntrenadorService } from '../services/entrenador.service';

export const equipoAdminGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const svc = inject(EntrenadorService);
  const router = inject(Router);
  const id = route.paramMap.get('id')!;

  if (auth.usuario()?.esAdmin) return true;

  return svc.getEquipoById(id).pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/']))),
  );
};
