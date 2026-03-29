import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface DashboardStats {
  totalUsers: number;
  totalHouseHelps: number;
  totalHomeOwners: number;
  totalAgents: number;
  totalHireRequests: number;
  pendingHireRequests: number;
  acceptedHireRequests: number;
  usersThisWeek: number;
  usersThisMonth: number;
  houseHelpsThisMonth: number;
  homeOwnersThisMonth: number;
  totalRevenue: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  successfulPayments: number;
  pendingPayments: number;
}

@Injectable()
export class StatsService {
  private readonly url = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.url);
  }
}
