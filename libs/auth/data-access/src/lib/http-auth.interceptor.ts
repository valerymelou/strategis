import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const httpAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only intercept 401s on non-auth endpoints to prevent infinite loops
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return authService.refreshToken().pipe(
          switchMap(() => next(req)),
          catchError((refreshError) => {
            // Refresh failed — clear client state.
            // Only redirect to login when NOT already on a public auth route
            // (e.g. /auth/reset-password visited while unauthenticated).
            authService.currentUser.set(null);
            const onAuthRoute = window.location.pathname.startsWith('/auth/');
            if (!onAuthRoute) {
              router.navigate(['/auth/login']);
            }
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
