import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environments';

@Injectable()
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(
    page: number = 0,
    size: number = 20,
    filter: any = {}
  ): Observable<{ data: any[]; length: number }> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);


    return this.http.post<any>(`${this.apiUrl}/search`, filter, { params }).pipe(
      map(res => ({
        data: res.content ?? res,
        length: res.totalElements ?? res.length ?? 0
      }))
    );
  }

  register(househelp: any): Observable<any> {
    return this.http.post(this.apiUrl, househelp);
  }

  updateUserRoles(userId:any, roles:any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/roles/edit`, {userId,roles});
  }


}
