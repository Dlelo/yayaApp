import {Component, inject, signal} from '@angular/core';
import {RouterModule, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {LoginService} from './login/login.service';
import {AuthService} from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App {
  private readonly router: Router = inject(Router);
  private readonly loginService: LoginService =inject(LoginService);
  private readonly authService:AuthService = inject(AuthService);

  isLoggedIn = this.loginService.isLoggedIn;
  userId = this.loginService.userId;
  roles = this.loginService.userRoles;

  navigate(path: string) {
    this.router.navigate([path]);
  }

  logout():void{
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
