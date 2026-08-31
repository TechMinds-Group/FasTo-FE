import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getMe().pipe(
    map(user => {
      if (user) {
        const isSuperAdmin = user.role === 'SuperAdmin' || user.roles?.includes('SuperAdmin') || user.email === 'micheladm@fasto.com' || user.email?.startsWith('micheladm');
        if (isSuperAdmin && (state.url === '/' || state.url === '/dashboard' || state.url.startsWith('/dashboard'))) {
          return router.createUrlTree(['/sg-perfil-x7k9p']);
        }
        return true;
      }
      return router.createUrlTree(['/login']);
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login']));
    })
  );
};
