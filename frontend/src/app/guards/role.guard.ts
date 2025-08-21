import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const expectedRole = route.data['expectedRole'];
    const userRole = this.auth.getUserRole();

    if (userRole !== expectedRole) {
      this.router.navigate(['/']); 
      return false;
    }
    return true;
  }
}
