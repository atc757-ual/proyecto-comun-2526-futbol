import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, from, switchMap } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('jwt_token');

  let request = req;
  if (token) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si recibimos un 401 (Unauthorized), intentamos refrescar el token de nuestro backend
      if (error.status === 401) {
        
        // Evitamos bucles infinitos si la propia ruta de signin falla
        if (req.url.includes('/auth/signin')) {
          return throwError(() => error);
        }

        console.warn('[AUTH INTERCEPTOR] 401 Detectado. Intentando refresco silencioso...');

        // Intentamos re-sincronizar con el backend usando el token actual de Firebase
        // (Firebase SDK gestiona internamente la renovación de su propio token)
        return from(authService.syncUserWithBackend()).pipe(
          switchMap(() => {
            const newToken = localStorage.getItem('jwt_token');
            console.log('[AUTH INTERCEPTOR] Refresco exitoso, reintentando petición original.');
            
            const retryRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryRequest);
          }),
          catchError((refreshError) => {
            console.error('[AUTH INTERCEPTOR] El refresco silencioso falló. Redirigiendo a Login.');
            authService.logout();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};
