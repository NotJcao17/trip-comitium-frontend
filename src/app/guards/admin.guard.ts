import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true; // Pásale jefe
  } else {
    // Si tiene sesión pero no es admin, al dashboard
    if (authService.isLoggedIn()) {
        // Recuperamos el tripId del localStorage o redirigimos al home si falla
        router.navigate(['/']);
    } else {
        router.navigate(['/join']);
    }
    return false;
  }
};
