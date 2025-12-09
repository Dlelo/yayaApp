import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  register(data: { name: string; phone: string; username: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }
}
