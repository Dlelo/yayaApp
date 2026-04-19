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

export interface Agency {
  id: number;
  name: string;
  phoneNumber?: string;
  email?: string;
  locationOfOperation?: string;
  homeLocation?: string;
  houseNumber?: string;
  verified: boolean;
}

@Injectable()
export class AgentService {
  private readonly apiUrl = `${environment.apiUrl}/agent`;
  private readonly agencyUrl = `${environment.apiUrl}/agency`;

  constructor(private http: HttpClient) {}

  getAgents(page: number = 0, size: number = 20): Observable<PageResponse<any>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PageResponse<any>>(this.apiUrl, { params });
  }

  verifyAgent(id: number): Observable<Agent> {
    return this.http.put<Agent>(`${this.apiUrl}/verify/${id}`, null);
  }

  updateAgent(id: number, data: Partial<Agent>): Observable<Agent> {
    return this.http.patch<Agent>(`${this.apiUrl}/${id}`, data);
  }

  /** Create a new Agency entity (business) */
  createAgency(data: { name: string; phoneNumber?: string; email?: string; locationOfOperation?: string; homeLocation?: string; houseNumber?: string }): Observable<Agency> {
    return this.http.post<Agency>(this.agencyUrl, data);
  }

  verifyAgency(id: number): Observable<Agency> {
    return this.http.put<Agency>(`${this.agencyUrl}/${id}/verify`, null);
  }
}
