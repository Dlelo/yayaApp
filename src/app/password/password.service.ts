import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface ForgotPasswordResponse {
  message: string;
  /** Set when the identifier matched a real account. Used to complete the OTP step. */
  sessionToken?: string;
  /** Which channel the OTP was delivered on: "sms" | "email" | "logged". */
  channel?: 'sms' | 'email' | 'logged';
}

export interface PasswordAck {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  forgotPassword(identifier: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.api}/auth/forgot-password`, {
      identifier,
    });
  }

  resetPassword(token: string, code: string, newPassword: string): Observable<PasswordAck> {
    return this.http.post<PasswordAck>(`${this.api}/auth/reset-password`, {
      token,
      code,
      newPassword,
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<PasswordAck> {
    return this.http.post<PasswordAck>(`${this.api}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
