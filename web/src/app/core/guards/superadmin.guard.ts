import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const superadminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const check = () => {
    const u = auth.usuario();
    if (u?.esAdmin) return true;
    return router.createUrlTree(['/fantasy']);
  };

  if (!auth.cargando()) return check();

  return toObservable(auth.cargando).pipe(
    filter(c => !c),
    take(1),
    map(check),
  );
};
