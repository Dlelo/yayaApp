import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class HousehelpService {
  private apiUrl = `${environment.apiUrl}/househelp`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  register(househelp: any): Observable<any> {
    return this.http.post(this.apiUrl, househelp);
  }
}
