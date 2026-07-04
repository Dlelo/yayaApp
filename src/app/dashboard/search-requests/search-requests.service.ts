import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export enum LookupPaymentStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export interface HouseHelpLookupAudit {
  id: number;
  payerPhoneNumber: string;
  houseHelpId: number | null;
  houseHelpName: string | null;
  status: LookupPaymentStatus;
  amount: number;
  createdAt: string;
}

export interface HouseHelpLookupAuditPage {
  content: HouseHelpLookupAudit[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * Admin-facing audit trail of the anonymous "pay to reveal contact details
 * via SMS" flow — every attempt (pending, successful, or failed), for
 * oversight of who paid to look up whose contact details.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchRequestsService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  getLookupRequests(page: number = 0, size: number = 20): Observable<HouseHelpLookupAuditPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<HouseHelpLookupAuditPage>(`${this.apiUrl}/lookup-requests`, { params });
  }
}
