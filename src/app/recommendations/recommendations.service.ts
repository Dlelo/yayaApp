import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}

@Injectable({ providedIn: 'root' })
export class RecommendationsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getRecommendations(): Observable<HouseHelpMatch[]> {
    return this.http.get<HouseHelpMatch[]>(
      `${this.apiUrl}/home-owner/preferences/househelps/recommendations`
    );
  }
}
