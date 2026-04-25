import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environments';

export type HireStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface HireRequestPayload {
  houseHelpId: number;
  startDate: string; // ISO yyyy-MM-dd
  message: string;
}

export interface HireRequestResponse {
  id: number;
  homeOwnerId: number;
  homeOwnerName: string;
  homeOwnerUserId: number;
  houseHelpId: number;
  houseHelpName: string;
  status: HireStatus;
  createdAt: string;
  startDate: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class HireRequestService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  create(payload: HireRequestPayload): Observable<HireRequestResponse> {
    return this.http.post<HireRequestResponse>(`${this.api}/hire-requests`, payload);
  }

  forHomeOwner(homeOwnerId: number): Observable<HireRequestResponse[]> {
    return this.http.get<HireRequestResponse[]>(
      `${this.api}/hire-requests/homeowner/${homeOwnerId}`
    );
  }

  /** Fetch a house help's contact phone — used for tap-to-call from My Hires. */
  getHouseHelpPhone(houseHelpId: number): Observable<string | null> {
    return this.http
      .get<any>(`${this.api}/househelp/${houseHelpId}`)
      .pipe(map((hh) => hh?.user?.phoneNumber ?? null));
  }

  /** Resolve the HomeOwner entity ID from the logged-in user ID. */
  resolveHomeOwnerId(userId: number): Observable<number> {
    return new Observable<number>((sub) => {
      this.http.get<any>(`${this.api}/users/${userId}`).subscribe({
        next: (user) => {
          const id = user?.homeOwner?.id;
          if (id == null) {
            sub.error(new Error('No homeowner profile linked to this account.'));
          } else {
            sub.next(id);
            sub.complete();
          }
        },
        error: (err) => sub.error(err),
      });
    });
  }
}
