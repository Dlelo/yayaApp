import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Agent, PageResponse } from './agents.component';

@Injectable({ providedIn: 'root' })
export class AgentsService {
  private apiUrl = `${environment.apiUrl}/agent`;

  constructor(private http: HttpClient) {}

  getAgents(page: number, size: number): Observable<PageResponse<Agent>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<Agent>>(this.apiUrl, { params });
  }

  deleteAgent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
