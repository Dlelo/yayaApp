import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';
import {AuthService} from '../auth/auth.service';

export interface LoginResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  private http = inject(HttpClient);
  private authService:AuthService = inject(AuthService);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          this.authService.setToken(res.token);
        })
      );
  }

  logout() {
    this.authService.clearToken();
  }

  isLoggedIn(): boolean {
    return !!this.authService.getToken();
  }
}
