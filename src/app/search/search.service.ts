import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface UnlockStatus {
  unlocked: boolean;
  hasSubscription: boolean;
}

export interface HouseHelpFullDetails {
  name: string;
  phoneNumber: string;
  currentLocation: string;
  homeLocation: string;
  yearsOfExperience: number;
  age: string;
  gender: string;
  languages: string[];
  skills: string[];
  houseHelpType: string;
  profilePictureDocument: string;
  experienceSummary: string;
  levelOfEducation: string;
  religion: string;
  availability: string;
  identityVerified: boolean;
  goodConductVerified: boolean;
  medicalReportVerified: boolean;
  securityCleared: boolean;
  verified: boolean;
}

export interface SubscriptionStatus {
  active: boolean;
  plan?: string;
  endDate?: string;
}

export interface GuestConsentPayload {
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  userAgent: string;
  latitude: number | null;
  longitude: number | null;
  termsAccepted: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/househelp`;
  private subBase = `${environment.apiUrl}/subscription`;

  getUnlockStatus(houseHelpId: number): Observable<UnlockStatus> {
    return this.http.get<UnlockStatus>(`${this.base}/${houseHelpId}/unlock-status`);
  }

  unlockProfile(houseHelpId: number): Observable<any> {
    return this.http.post(`${this.base}/${houseHelpId}/unlock`, {});
  }

  // Backend: POST /househelp/{id}/unlock-phone — records KES 500 phone-unlock payment (auth required)
  unlockPhone(houseHelpId: number): Observable<any> {
    return this.http.post(`${this.base}/${houseHelpId}/unlock-phone`, {});
  }

  getFullDetails(houseHelpId: number): Observable<HouseHelpFullDetails> {
    return this.http.get<HouseHelpFullDetails>(`${this.base}/${houseHelpId}/full`);
  }

  // Backend: GET /househelp/{id}/phone — returns phone number; 402 if not yet unlocked (auth required)
  getPhoneNumber(houseHelpId: number): Observable<{ phoneNumber: string }> {
    return this.http.get<{ phoneNumber: string }>(`${this.base}/${houseHelpId}/phone`);
  }

  // Backend: GET /househelp/{id}/guest-full?paymentRef=... — returns profile WITHOUT phone/ID for guests (no auth; validates M-Pesa reference)
  guestGetFullDetails(houseHelpId: number, paymentRef: string): Observable<HouseHelpFullDetails> {
    return this.http.get<HouseHelpFullDetails>(
      `${this.base}/${houseHelpId}/guest-full`,
      { params: { paymentRef } }
    );
  }

  // Backend: GET /househelp/{id}/pdf — returns PDF blob; auth or guest paymentRef query param
  downloadProfilePdf(houseHelpId: number, paymentRef?: string): Observable<Blob> {
    const url = paymentRef
      ? `${this.base}/${houseHelpId}/pdf?paymentRef=${encodeURIComponent(paymentRef)}`
      : `${this.base}/${houseHelpId}/pdf`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // Backend: POST /guest/consent — logs name, nationalId, phone, userAgent, lat/lng, timestamp (no auth)
  logGuestConsent(payload: GuestConsentPayload): Observable<any> {
    return this.http.post(`${environment.apiUrl}/guest/consent`, payload);
  }

  // Backend: POST /househelp/lookup-sms — starts an M-Pesa STK push (no auth).
  // Omit houseHelpPhoneNumber for a random available match (KES 100); include it
  // to name a specific house help by phone/National ID (KES 500 total).
  initiateHouseHelpLookupPayment(
    payerPhoneNumber: string,
    houseHelpPhoneNumber?: string
  ): Observable<{ message: string; checkoutRequestId: string; status: string }> {
    return this.http.post<any>(`${this.base}/lookup-sms`, {
      payerPhoneNumber,
      houseHelpPhoneNumber: houseHelpPhoneNumber || undefined,
    });
  }

  // Backend: GET /payments/lookup/status/{checkoutRequestId} — poll target for the payment above (no auth).
  getHouseHelpLookupStatus(checkoutRequestId: string): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${environment.apiUrl}/payments/lookup/status/${checkoutRequestId}`);
  }

  getSubscriptionStatus(): Observable<SubscriptionStatus> {
    return this.http.get<SubscriptionStatus>(`${this.subBase}/status`);
  }

  activateHomeownerPlus(): Observable<SubscriptionStatus> {
    return this.http.post<SubscriptionStatus>(`${this.subBase}/activate-homeowner-plus`, {});
  }
}
