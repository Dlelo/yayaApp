import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class HousehelpService {
  private apiUrl = `${environment.apiUrl}/househelp`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ data: any[]; length: number }> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => ({
        data: res.content,
        length: res.totalElements
      }))
    );
  }

  register(househelp: any): Observable<any> {
    return this.http.post(this.apiUrl, househelp);
  }
}
