import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { UsersService } from '../services/users/users.service';
import { AuthService } from '../services/auth/auth.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(private auth: AuthService,
    private user: UsersService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
  const requiredPermissions = route.data['permissions'] as string[];
  const user = this.auth.getUser();

  if (!user || !user.id) {
    this.router.navigate(['/login']);
    return of(false);
  }

  return this.user.getUserPermissions(user.id).pipe(
    map(response => {
      const userPermissions = response.permissions;
      const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

      if (!hasPermission) {
        this.router.navigate(['/unauthorized']);
        return false;
      }

      return true;
    }),
    catchError(err => {
      this.router.navigate(['/unauthorized']);
      return of(false);
    })
  );
}

}
