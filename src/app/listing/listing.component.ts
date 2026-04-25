import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HousehelpService } from '../dashboard/house-helps/house-helps.service';
import { Observable, of } from 'rxjs';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { AsyncPipe, NgClass, SlicePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { LoginService } from '../login/login.service';
import { RecommendationsService, HouseHelpMatch } from '../recommendations/recommendations.service';

@Component({
  standalone: true,
  selector: 'app-listings',
  templateUrl: './listing.component.html',
  styleUrls: ['./listing.component.scss'],
  providers: [HousehelpService],
  imports: [
    FormsModule,
    MatCard,
    AsyncPipe,
    NgClass,
    SlicePipe,
    MatCardContent,
    MatCardActions,
    MatButton,
    MatPaginator,
    MatIcon
  ]
})
export class ListingsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private househelpService = inject(HousehelpService);
  private loginService = inject(LoginService);
  private recommendationsService = inject(RecommendationsService);

  houseHelps$!: Observable<any>;
  recommendations = signal<HouseHelpMatch[]>([]);
  recommendationsLoading = signal(false);
  recommendationsError = signal<string | null>(null);
  /** When true, the API returns every evaluated candidate (passed + excluded) with reasons. */
  showAllCandidates = signal(false);
  activeTab = signal<'browse' | 'recommended'>('browse');

  page: number = 0;
  size: number = 20;
  type: string = 'ALL';

  get isHomeOwner() {
    return this.loginService.userRoles().includes('ROLE_HOMEOWNER');
  }

  filters: any = {
    active: true,
    houseHelpType: null,
    experience: null,
    minExpectedSalary: null,
    maxExpectedSalary: null,
    location: null,
    languages: null,
    hiringStatus: null,
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.type = (params.get('type') || 'all').toUpperCase();
      this.filters.houseHelpType = this.type === 'ALL' ? null : this.type;
      this.filters.hiringStatus = "AVAILABLE";
      this.load(this.type);
    });

    if (this.isHomeOwner) {
      this.loadRecommendations();
    }
  }

  loadRecommendations(): void {
    this.recommendationsLoading.set(true);
    this.recommendationsError.set(null);
    this.recommendationsService.getRecommendations(this.showAllCandidates()).subscribe({
      next: data => {
        this.recommendations.set(data ?? []);
        this.recommendationsLoading.set(false);
      },
      error: (err) => {
        this.recommendationsLoading.set(false);
        if (err?.status === 401 || err?.status === 403) {
          this.recommendationsError.set('Sign in as a homeowner to see recommendations.');
        } else if (err?.status === 404) {
          this.recommendationsError.set('Complete your homeowner profile to unlock recommendations.');
        } else {
          this.recommendationsError.set('Could not load recommendations. Please try again.');
        }
      }
    });
  }

  goToPreferences(): void {
    const userId = this.loginService.userId();
    if (userId) {
      this.router.navigate(['/edit-account', userId]);
    }
  }

  toggleShowAllCandidates(): void {
    this.showAllCandidates.update(v => !v);
    this.loadRecommendations();
  }

  load(type: string) {
    this.houseHelps$ = this.househelpService.getAll(
      type,
      this.page,
      this.size,
      this.filters
    );
  }

  applyFilters() {
    this.page = 0;
    this.load(this.type);
  }

  clearFilters() {
    this.filters = {
      active: true,
      houseHelpType: this.filters.houseHelpType,
    };
    this.load(this.type);
  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.load(this.type);
  }

  seeDetails(id: number) {
    this.router.navigate(['/profile', id]);
  }

  getAvailabilityClass(houseHelpType: string): string {
    if (!houseHelpType) return '';
    switch (houseHelpType.toUpperCase()) {
      case 'DAYBURG': return 'dayburg';
      case 'LIVE_IN': return 'live-in';
      case 'EMERGENCY': return 'emergency';
      default: return '';
    }
  }

  formatAvailability(houseHelpType: string): string {
    if (!houseHelpType) return 'Not specified';
    return houseHelpType.replace('_', ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getMatchScoreClass(score: number): string {
    if (score >= 80) return 'match-excellent';
    if (score >= 60) return 'match-good';
    return 'match-fair';
  }
}
