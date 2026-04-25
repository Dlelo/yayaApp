import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class AccountDetailsService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  getUserById(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}`);
  }

  getHouseHelpDetails(houseHelpId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/househelp/${houseHelpId}`);
  }

  getHomeOwnerDetails(homeOwnerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/homeowner/${homeOwnerId}`);
  }

  /** Hire history for a homeowner (by homeOwner entity ID) */
  getHomeOwnerHireHistory(homeOwnerId: number): Observable<HireRequest[]> {
    return this.http.get<HireRequest[]>(`${this.apiUrl}/hire-requests/homeowner/${homeOwnerId}`);
  }

  /** Hire requests received by a househelp (by houseHelp entity ID) */
  getHouseHelpHireRequests(houseHelpId: number): Observable<HireRequest[]> {
    return this.http.get<HireRequest[]>(`${this.apiUrl}/hire-requests/househelp/${houseHelpId}`);
  }

  /** Payment history for a user (newest first). Self-or-admin scoped server-side. */
  getUserPayments(userId: number): Observable<PaymentRecord[]> {
    return this.http.get<PaymentRecord[]>(`${this.apiUrl}/payments/user/${userId}`);
  }

  /** Househelps assigned to an agent */
  getAgentHouseHelps(agentId: number): Observable<AgentHouseHelp[]> {
    return this.http.get<AgentHouseHelp[]>(`${this.apiUrl}/agent/${agentId}/househelps`);
  }

  /** Earnings summary including hire requests and withdrawal history */
  getAgentEarnings(agentId: number): Observable<AgentEarnings> {
    return this.http.get<AgentEarnings>(`${this.apiUrl}/agent/${agentId}/earnings`);
  }

  /** Submit a withdrawal request */
  requestWithdrawal(agentId: number, amount: number, mpesaPhone: string, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/agent/${agentId}/withdrawal`, { amount, mpesaPhone, notes });
  }

  /**
   * Fetch image from URL and convert to blob URL.
   */
  fetchPrivateImage(imageUrl: string): Observable<string | null> {
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      return of(imageUrl);
    }

    return this.http.get(imageUrl, {
      responseType: 'blob',
      withCredentials: true
    }).pipe(
      map(blob => URL.createObjectURL(blob)),
      catchError(error => {
        console.error('Failed to fetch image:', imageUrl, error);
        return of(null);
      })
    );
  }

  fetchPrivateImageSafe(imageUrl: string): Observable<SafeUrl | null> {
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      return of(this.sanitizer.bypassSecurityTrustUrl(imageUrl));
    }

    return this.http.get(imageUrl, {
      responseType: 'blob',
      withCredentials: true
    }).pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      }),
      catchError(error => {
        console.error('Failed to fetch image:', imageUrl, error);
        return of(null);
      })
    );
  }

  revokeBlobUrl(blobUrl: string): void {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
