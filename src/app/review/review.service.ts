import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface ReviewResponse {
  id: number;
  reviewerName: string;
  revieweeId: number;
  revieweeType: 'HOUSE_HELP' | 'HOME_OWNER';
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewRequest {
  revieweeId: number;
  revieweeType: 'HOUSE_HELP' | 'HOME_OWNER';
  rating: number;
  comment: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getHouseHelpReviews(id: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.apiUrl}/reviews/househelp/${id}`);
  }

  getHomeOwnerReviews(id: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.apiUrl}/reviews/homeowner/${id}`);
  }

  getHouseHelpRatingSummary(id: number): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.apiUrl}/reviews/househelp/${id}/summary`);
  }

  getHomeOwnerRatingSummary(id: number): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.apiUrl}/reviews/homeowner/${id}/summary`);
  }

  submitReview(request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.apiUrl}/reviews`, request);
  }
}
