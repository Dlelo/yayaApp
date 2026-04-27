import { Component, inject, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LoginService } from './login/login.service';
import { AuthService } from './auth/auth.service';
import { PlatformService } from './core/platform.service';
import { MobileTabBarComponent } from './mobile-shell/mobile-tab-bar.component';
import { OfflineBannerComponent } from './mobile-shell/offline-banner.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MobileTabBarComponent,
    OfflineBannerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App {
  private readonly router: Router = inject(Router);
  private readonly loginService: LoginService = inject(LoginService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly platform = inject(PlatformService);

  isLoggedIn = this.loginService.isLoggedIn;
  userId = this.loginService.userId;
  roles = this.loginService.userRoles;
  readonly isNative = this.platform.isNative();
  /** Toggles the mobile/tablet hamburger drawer in the desktop toolbar. */
  readonly navOpen = signal(false);

  navigate(path: string) {
    this.router.navigate([path]);
  }

  toggleNav(): void {
    this.navOpen.update(v => !v);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
