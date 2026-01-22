import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environments';

@Injectable()
export class HomeOwnerService {
  private apiUrl = `${environment.apiUrl}/homeowner`;

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

  register(homeowner: any): Observable<any> {
    return this.http.post(this.apiUrl, homeowner);
  }

  updateHomeOwnerDetails(id: number, homeOwner: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, homeOwner);
  }

  setActiveStatus(id: number|undefined, active: boolean) {
    return this.http.put<HouseHelp>(
      `${this.apiUrl}/${id}/active`,
      null,
      {
        params: { active },
      }
    );
  }


  getHomeOwners(
    page: number,
    size: number,
    active: boolean | null
  ): Observable<PageResponse<HomeOwner>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    const filter = { active };

    return this.http.post<PageResponse<HomeOwner>>(
      `${this.apiUrl}/search`,
      filter,
      { params }
    );
  }

  setSecurityCleared(
    homeOwnerId: number|undefined,
    cleared: boolean,
    comments?: string
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${homeOwnerId}/security-cleared`,
      {
        cleared,
        comments
      }
    );
  }



}
