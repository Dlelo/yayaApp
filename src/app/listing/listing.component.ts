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
    this.recommendationsService.getRecommendations().subscribe({
      next: data => this.recommendations.set(data),
      error: () => {}
    });
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
