import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { LoginService } from './login/login.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private router: Router,
    private readonly loginService: LoginService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const userRoles = this.loginService.userRoles();

    const isLoggedIn = this.loginService.isLoggedIn();

    if (isLoggedIn && userRoles && userRoles.some(role => expectedRoles.includes(role))) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}
