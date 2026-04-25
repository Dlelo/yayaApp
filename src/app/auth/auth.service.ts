import { Injectable, inject } from '@angular/core';
import { StorageService } from '../core/storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly storage = inject(StorageService);

  getToken(): string | null {
    return this.storage.get(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    this.storage.set(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    this.storage.remove(this.TOKEN_KEY);
  }
}
