import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

@Injectable()
export class HireRequestsService {
  private apiUrl = `${environment.apiUrl}/hire-requests`;

  constructor(private http: HttpClient) {}

  getHireRequests(
    page: number,
    size: number,
    filter: { status?: string; paid?: boolean } = {}
  ): Observable<PageResponse<HireRequest>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    Object.keys(filter).forEach(key => {
      const value = (filter as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<PageResponse<HireRequest>>(this.apiUrl, { params });
  }

  updateStatus(id: number, status: string): Observable<HireRequest> {
    return this.http.patch<HireRequest>(
      `${this.apiUrl}/${id}/status`,
      { status }
    );
  }
}