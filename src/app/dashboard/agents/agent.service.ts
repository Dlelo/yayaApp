import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface AgentUser {
  id: number;
  name: string;
  email: string;
}

export interface Agent {
  id: number;
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  email: string;
  locationOfOperation: string;
  homeLocation: string;
  houseNumber: string;
  idDocument: string;
  verified: boolean;
  user: AgentUser;
}

@Injectable()
export class AgentService {
  private readonly apiUrl = `${environment.apiUrl}/agent`;

  constructor(private http: HttpClient) {}

  getAgents(page: number = 0, size: number = 20): Observable<PageResponse<Agent>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<Agent>>(this.apiUrl, { params });
  }

  verifyAgent(id: number): Observable<Agent> {
    return this.http.put<Agent>(`${this.apiUrl}/verify/${id}`, null);
  }

  assignHouseHelp(agentId: number, househelpId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${agentId}/househelps/${househelpId}`, null);
  }
}
