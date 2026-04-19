import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environments';

@Injectable()
export class HousehelpService {
  private apiUrl = `${environment.apiUrl}/househelp`;

  constructor(private http: HttpClient) {}


  getHouseHelps(
    page: number,
    size: number,
    active: boolean | null
  ): Observable<PageResponse<HouseHelp>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    const filter = { active };

    return this.http.post<PageResponse<HouseHelp>>(
      `${this.apiUrl}/search`,
      filter,
      { params }
    );
  }


  getAll(
    type?:string,
    page: number = 0,
    size: number = 20,
    filter: any = {
      active: true,
      houseHelpType: type && type !== 'ALL' ? type : undefined
    }
  ): Observable<{ data: any[]; length: number; pages: any }> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);
    if (type && type !== 'all') {
      params = params.set('houseHelpType', type);
    }

    return this.http.post<any>(`${this.apiUrl}/search`, filter, { params }).pipe(
      map(res => {
        let data;
        try {
          data = JSON.parse(res);
        } catch {
          data = res;
        }

        return {
          data: data.content ?? data,
          length: data.totalElements ?? data.length ?? 0,
          pages: data.pageable ?? 0
        };
      })
    );
  }

  register(househelp: any): Observable<any> {
    return this.http.post(this.apiUrl, househelp);
  }

  updateHouseHelpDetails(id: number, househelp: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, househelp);
  }


  setActiveStatus(id: number, active: boolean) {
    return this.http.put<HouseHelp>(
      `${this.apiUrl}/${id}/active`,
      null,
      {
        params: { active },
      }
    );
  }

  setSecurityCleared(
    houseHelpId: number|undefined,
    cleared: boolean,
    comments?: string
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${houseHelpId}/security-cleared`,
      {
        cleared,
        comments
      }
    );
  }

  updateHiringStatus(id: number, hiringStatus: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, { hiringStatus });
  }

  getAgents(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/agent?size=100`);
  }

  assignToAgent(houseHelpId: number, agentId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${houseHelpId}/assign-agent/${agentId}`, null);
  }

}
