import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface AgencyMember {
  id: number;      // agent entity id
  userId: number;
  name: string;
  email?: string;
  phoneNumber?: string;
  agentRole: string;
  verified: boolean;
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
  members: AgencyMember[];
}

export interface AgencyPage {
  content: Agency[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AgentHouseHelp {
  id: number;
  userId: number;
  name: string;
  phone?: string;
  verified: boolean;
  active: boolean;
  hiringStatus?: string;
}

export interface AgentHireRequest {
  id: number;
  houseHelpName?: string;
  houseHelpUserId?: number;
  homeOwnerName?: string;
  homeOwnerUserId?: number;
  homeOwnerId?: number;
  status: string;
  createdAt?: string;
  startDate?: string;
  commissionEarned: number;
}

export interface WithdrawalRequest {
  id: number;
  amount: number;
  status: string;
  requestedAt?: string;
  processedAt?: string;
  mpesaPhone?: string;
  notes?: string;
}

export interface AgencyEarnings {
  agentId: number;
  totalHires: number;
  totalEarned: number;
  totalWithdrawn: number;
  balanceRemaining: number;
  hireRequests: AgentHireRequest[];
  withdrawals: WithdrawalRequest[];
}

@Injectable()
export class AgentPortalService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  /** Get own agency (for logged-in agent) */
  getMyAgency(): Observable<Agency> {
    return this.http.get<Agency>(`${this.api}/agency/my`);
  }

  /** Get agency by ID (used by admin portal view) */
  getAgency(agencyId: number): Observable<Agency> {
    return this.http.get<Agency>(`${this.api}/agency/${agencyId}`);
  }

  /** Earnings for this agency */
  getEarnings(agencyId: number): Observable<AgencyEarnings> {
    return this.http.get<AgencyEarnings>(`${this.api}/agency/${agencyId}/earnings`);
  }

  /** Househelps under this agency */
  getHouseHelps(agencyId: number): Observable<AgentHouseHelp[]> {
    return this.http.get<AgentHouseHelp[]>(`${this.api}/agency/${agencyId}/househelps`);
  }

  /** Submit withdrawal request */
  requestWithdrawal(agencyId: number, amount: number, mpesaPhone: string, notes?: string): Observable<WithdrawalRequest> {
    return this.http.post<WithdrawalRequest>(`${this.api}/agency/${agencyId}/withdrawal`, { amount, mpesaPhone, notes });
  }

  /** Update agency business details */
  updateAgency(agencyId: number, data: Partial<Omit<Agency, 'id' | 'verified' | 'members'>>): Observable<Agency> {
    return this.http.patch<Agency>(`${this.api}/agency/${agencyId}`, data);
  }

  /** Add a member to this agency by phone number */
  addMember(agencyId: number, phone: string, role: string): Observable<Agency> {
    return this.http.post<Agency>(`${this.api}/agency/${agencyId}/members`, { phone, role });
  }

  /** Remove a member from this agency */
  removeMember(agencyId: number, agentId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/agency/${agencyId}/members/${agentId}`);
  }

  /** Register a new househelp and assign them to this agency */
  registerHouseHelp(agencyId: number, data: { name: string; phoneNumber: string; email?: string; password: string }): Observable<any> {
    return this.http.post(`${this.api}/agency/${agencyId}/househelps/register`, data);
  }

  /** Get all agencies (admin only, paginated) */
  getAllAgencies(page = 0, size = 20): Observable<AgencyPage> {
    return this.http.get<AgencyPage>(`${this.api}/agency`, { params: { page: page.toString(), size: size.toString() } });
  }

  /** Create a new agency (admin only) */
  createAgency(data: Omit<Agency, 'id' | 'verified' | 'members'>): Observable<Agency> {
    return this.http.post<Agency>(`${this.api}/agency`, data);
  }

  /** Search users by phone number or name (for adding members) */
  lookupUsers(q: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/users/lookup`, { params: { q } });
  }
}
