import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface HouseHelpMatch {
  houseHelp: {
    id: number;
    name: string;
    houseHelpType: string;
    skills: string[];
    verified: boolean;
    securityCleared: boolean;
  };
  matchScore: number;
  /** Whether the candidate passed all hard filters. Always true unless includeExcluded=true. */
  passed?: boolean;
  /** Per-candidate notes — score contributions and exclusion reasons. */
  reasons?: string[];
}

@Injectable({ providedIn: 'root' })
export class RecommendationsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getRecommendations(includeExcluded = false): Observable<HouseHelpMatch[]> {
    const params = new HttpParams().set('includeExcluded', String(includeExcluded));
    return this.http.get<HouseHelpMatch[]>(
      `${this.apiUrl}/home-owner/preferences/househelps/recommendations`,
      { params }
    );
  }
}
