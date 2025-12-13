import {Injectable} from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountDetailsService {
  private userUrl =`${environment.apiUrl}/users`;


  constructor(private http: HttpClient) {}

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.userUrl}/${id}`);
  }

  getHouseHelpDetails(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/househelp/${id}`);
  }

  getHomeOwnerDetails(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/homeowner/${id}`);
  }


  updateUser(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.userUrl}/${id}`, payload).pipe(
      map((response) => {
        console.log('User updated successfully:', response);
        return response;
      })
    );
  }

}
