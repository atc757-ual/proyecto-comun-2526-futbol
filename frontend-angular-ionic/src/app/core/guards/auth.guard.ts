import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

// Guard para rutas protegidas: bloquea si no hay sesión
export const authGuard = () => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Comprobación síncrona primero (evita race condition con Firebase)
  if (auth.currentUser) {
    return true;
  }

  return authService.user$.pipe(
    take(1),
    map(user => {
      if (user) return true;
      router.navigate(['/auth/login']);
      return false;
    })
  );
};

// Guard para la StartPage: si ya hay sesión, ir directo al Home
export const startGuard = () => {
  const auth = inject(Auth);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya tiene sesión en caché, redirigir directamente sin mostrar StartPage
  if (auth.currentUser) {
    console.log('[START-GUARD] Sesión en caché. Redirigiendo a /home...');
    router.navigate(['/home']);
    return false; // No mostrar StartPage
  }

  return authService.user$.pipe(
    take(1),
    map(user => {
      if (user) {
        console.log('[START-GUARD] Sesión activa. Redirigiendo a /home...');
        router.navigate(['/home']);
        return false; // No mostrar StartPage
      }
      return true; // Sin sesión → mostrar StartPage (que luego irá a login)
    })
  );
};
