import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
}

export interface UserInfo {
  userId: number;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService: AuthService = inject(AuthService);

  private currentUserSignal = signal<UserInfo | null>(null);

  public currentUser = this.currentUserSignal.asReadonly();
  public isLoggedIn = computed(() => !!this.currentUserSignal());
  public userRole = computed(() => this.currentUserSignal()?.role || null);
  public userId = computed(() => this.currentUserSignal()?.userId || null);

  constructor() {
    this.loadUserFromStorage();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          this.storeUserData(response);
        })
      );
  }

  private storeUserData(response: LoginResponse): void {
    if (this.isBrowser()) {
      localStorage.setItem('token', response.token);
      const userInfo = {
        userId: response.userId,
        email: response.email,
        role: response.role
      };
      localStorage.setItem('user', JSON.stringify(userInfo));

      // Update signal
      this.currentUserSignal.set(userInfo);
    }
  }

  private loadUserFromStorage(): void {
    // Check if we're in browser environment before accessing localStorage
    if (this.isBrowser()) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user: UserInfo = JSON.parse(userStr);
          this.currentUserSignal.set(user);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          this.clearStorage();
        }
      }
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private clearStorage(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSignal();
  }

  getToken(): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem('token');
    }
    return null;
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.userRole() === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.userRole();
    return userRole ? roles.includes(userRole) : false;
  }
}
