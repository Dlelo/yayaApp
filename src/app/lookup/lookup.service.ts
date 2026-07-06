import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface HouseHelpLookupPaymentRequest {
  payerPhoneNumber: string;
  houseHelpId?: number;
  houseHelpPhoneNumber?: string;
}

export interface StkPushResponse {
  message: string;
  checkoutRequestId: string;
  status: string;
}

export interface LookupStatusResponse {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

/**
 * Backs the anonymous "pay to reveal a house help's contact details via SMS"
 * flow. No login/JWT is required — the backend endpoints this calls are
 * permitAll (see SecurityConfig on the backend).
 */
@Injectable({
  providedIn: 'root'
})
export class HouseHelpLookupService {
  private apiUrl = `${environment.apiUrl}/payments`;
  private houseHelpUrl = `${environment.apiUrl}/househelp`;

  constructor(private http: HttpClient) {}

  initiateLookupPayment(request: HouseHelpLookupPaymentRequest): Observable<StkPushResponse> {
    return this.http.post<StkPushResponse>(`${this.houseHelpUrl}/lookup-sms`, request);
  }

  checkLookupStatus(checkoutRequestId: string): Observable<LookupStatusResponse> {
    return this.http.get<LookupStatusResponse>(`${this.apiUrl}/lookup/status/${checkoutRequestId}`);
  }
}
