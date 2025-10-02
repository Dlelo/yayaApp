import {Injectable} from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountDetailsService {
  private houseHelpUrl = `${environment.apiUrl}/househelp`;
  private homeOwnerUrl =`${environment.apiUrl}/homeowner`;


  constructor(private http: HttpClient) {}

  getHouseHelpById(id: number): Observable<any> {
    return this.http.get<any>(`${this.houseHelpUrl}/${id}`);
  }

  getHomeOwnerById(id: number): Observable<any> {
    return this.http.get<any>(`${this.homeOwnerUrl}/${id}`);
  }
}
