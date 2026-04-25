import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';
import { AuthService } from '../auth/auth.service';
import { StorageService } from '../core/storage.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export interface LoginResponse {
  token: string;
}

export interface UserInfo {
  userId: number;
  email: string;
  phoneNumber?: string;
  role: string[];
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService: AuthService = inject(AuthService);
  private storage = inject(StorageService);

  private currentUserSignal = signal<UserInfo | null>(null);

  public currentUser = this.currentUserSignal.asReadonly();
  public isLoggedIn = computed(() => !!this.currentUserSignal());
  public userRoles = computed(() => this.currentUserSignal()?.role || []);
  public userId = computed(() => this.currentUserSignal()?.userId || null);
  public email = computed(() => this.currentUserSignal()?.email || null);
  public phoneNumber = computed(() => this.currentUserSignal()?.phoneNumber || null);


  constructor() {
    this.loadUserFromStorage();
  }

  login(identifier: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { identifier, password })
      .pipe(
        tap(response => {
          this.storeUserData(response.token);
        })
      );
  }

  refreshAuthState(): void {
    this.loadUserFromStorage();
  }

  private storeUserData(token: string): void {
    // Save token
    this.authService.setToken(token);

    try {
      const decoded: any = jwtDecode(token);

      // Extract relevant fields from decoded token
      const userInfo: UserInfo = {
        userId: decoded?.userId,
        email: decoded?.sub,
        role: decoded?.roles,
      };

      this.storage.set('user', JSON.stringify(userInfo));
      this.currentUserSignal.set(userInfo);
    } catch (error) {
      console.error('Failed to decode token:', error);
      this.clearStorage();
    }
  }

  private extractRoles(roleClaim: string | string[]): string[] {
    if (!roleClaim) return [];
    if (Array.isArray(roleClaim)) return roleClaim;

    // Convert role string to readable role names if in format "[Role(id=1, name=HOMEOWNER,...)]"
    const roleMatches = [...roleClaim.matchAll(/name=(\w+)/g)];
    return roleMatches.map(match => match[1]);
  }

  private loadUserFromStorage(): void {
    const userStr = this.storage.get('user');
    if (userStr) {
      try {
        const user: UserInfo = JSON.parse(userStr);
        this.currentUserSignal.set(user);
      } catch (error) {
        console.error('Error parsing user data from storage:', error);
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    this.authService.clearToken();
    this.storage.remove('user');
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSignal();
  }

  getToken(): string | null {
    return this.authService.getToken();
  }

  logout(): void {
    this.clearStorage();
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.userRoles().includes(r));
  }
}
