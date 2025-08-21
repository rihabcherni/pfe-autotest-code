import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const unauthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const isAuthenticated = !!token;

  if (!isAuthenticated) {
    return true;
  } else {
    const role = authService.getUserRole(); 
    if (role === 'admin') {
      router.navigate(['/admin']);
    } else if (role === 'tester') {
      router.navigate(['/tester']);
    } else {
      router.navigate(['/']);
    }
    return false; 
  }
};
