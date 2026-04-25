import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../login/login.service';
import { PlatformService } from '../core/platform.service';

interface Tab {
  path: string;
  label: string;
  icon: string;
  needsAuth?: boolean;
  homeOwnerOnly?: boolean;
}

@Component({
  selector: 'app-mobile-tab-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './mobile-tab-bar.component.html',
  styleUrls: ['./mobile-tab-bar.component.scss'],
})
export class MobileTabBarComponent {
  private readonly platform = inject(PlatformService);
  private readonly login = inject(LoginService);
  private readonly router = inject(Router);

  readonly isNative = this.platform.isNative();

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e: RouterEvent): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** Hide the tab bar on auth screens so the keyboard doesn't push it. */
  readonly hidden = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.startsWith('/register');
  });

  readonly isLoggedIn = this.login.isLoggedIn;
  readonly roles = this.login.userRoles;
  readonly userId = this.login.userId;

  readonly tabs = computed<Tab[]>(() => {
    const r = this.roles();
    const isHomeOwner = r.includes('ROLE_HOMEOWNER');
    const out: Tab[] = [
      { path: '/listing', label: 'Find Help', icon: 'search', needsAuth: true },
    ];
    if (isHomeOwner) {
      out.push({ path: '/my-hires', label: 'My Hires', icon: 'history', homeOwnerOnly: true });
    }
    out.push({
      path: '/menu',
      label: this.isLoggedIn() ? 'Account' : 'Sign in',
      icon: this.isLoggedIn() ? 'account_circle' : 'login',
    });
    return out;
  });
}
