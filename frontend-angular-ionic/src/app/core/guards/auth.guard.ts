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
// Guard para rutas de administrador: bloquea si no tiene rol de admin
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  console.warn('[ADMIN-GUARD] Acceso denegado: El usuario no es administrador.');
  router.navigate(['/home']);
  return false;
};

// Guard para rutas de Administrador Maestro: solo el Super Admin puede entrar
export const masterGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isMasterAdmin()) {
    return true;
  }

  console.warn('[MASTER-GUARD] Acceso denegado: Se requieren privilegios de Administrador Maestro.');
  router.navigate(['/home']);
  return false;
};
