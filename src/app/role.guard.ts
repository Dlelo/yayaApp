import {CanActivate, Router} from '@angular/router';
import {AuthService} from './auth/auth.service';
import {Injectable} from '@angular/core';
import {LoginService} from './login/login.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private readonly loginService:LoginService
  ) {}

  canActivate(route: any): boolean {
    const expectedRoles = route.data['roles'] as Array<string>;
    const userRole = this.loginService.userRole();

    if (this.loginService.isLoggedIn() && userRole && expectedRoles.includes(userRole)) {
      return true;
    } else {
      this.router.navigate(['/unauthorized']);
      return false;
    }
  }
}
