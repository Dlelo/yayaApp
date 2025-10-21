import {Component, inject, signal} from '@angular/core';
import {RouterModule, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {Router} from '@angular/router';
import {LoginService} from './login/login.service';
import {AuthService} from './auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatButtonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App {
  private readonly router: Router = inject(Router);
  private readonly loginService: LoginService =inject(LoginService);
  private readonly authService:AuthService = inject(AuthService);

  isLoggedIn:boolean = this.loginService.isLoggedIn();
  userId:number | null = this.loginService.userId();

  navigate(path: string) {
    this.router.navigate([path]);
  }

  logout():void{
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
