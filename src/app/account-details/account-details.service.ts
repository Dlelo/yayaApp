import {Injectable} from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountDetailsService {
  private userUrl =`${environment.apiUrl}/user`;


  constructor(private http: HttpClient) {}

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.userUrl}/${id}`);
  }

}
