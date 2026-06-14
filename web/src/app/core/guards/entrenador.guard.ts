import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { EntrenadorService } from '../services/entrenador.service';

export const entrenadorGuard: CanActivateFn = () => {
  const entrenador = inject(EntrenadorService);
  const router = inject(Router);

  return entrenador.getMiEquipo().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/']))),
  );
};
