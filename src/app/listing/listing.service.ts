import {Injectable} from '@angular/core';
import {environment} from '../../environments/environments';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListingService {
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
}
