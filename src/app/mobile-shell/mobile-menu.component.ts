import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoginService } from '../login/login.service';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss'],
})
export class MobileMenuComponent {
  private readonly login = inject(LoginService);
  private readonly router = inject(Router);

  readonly isLoggedIn = this.login.isLoggedIn;
  readonly userId = this.login.userId;
  readonly email = this.login.email;
  readonly roles = this.login.userRoles;

  readonly isHomeOwner = computed(() => this.roles().includes('ROLE_HOMEOWNER'));

  readonly accountPath = computed(() => {
    const id = this.userId();
    return id ? `/account/${id}` : '/login';
  });

  readonly editPath = computed(() => {
    const id = this.userId();
    return id ? `/edit-account/${id}` : '/login';
  });

  signIn(): void {
    this.router.navigate(['/login']);
  }

  signOut(): void {
    this.login.logout();
  }
}
