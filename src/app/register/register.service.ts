import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private http = inject(HttpClient);
  private apiUrl = 'http://api.yayaconnectapp.com/api/auth';

  register(data: { name: string; phone: string; username: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }
}
