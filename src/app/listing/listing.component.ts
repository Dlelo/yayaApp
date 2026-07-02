import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HousehelpService } from '../dashboard/house-helps/house-helps.service';
import { Observable } from 'rxjs';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { AsyncPipe, NgClass, SlicePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LoginService } from '../login/login.service';
import { RecommendationsService, HouseHelpMatch } from '../recommendations/recommendations.service';
import { SearchService, SubscriptionStatus } from '../search/search.service';
import { UnlockDialogComponent } from '../search/unlock-dialog.component';
import { GuestConsentDialogComponent, GUEST_CONSENT_KEY, GuestConsent } from '../search/guest-consent-dialog.component';

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
    MatIcon,
    MatDialogModule,
  ]
})
export class ListingsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private househelpService = inject(HousehelpService);
  private loginService = inject(LoginService);
  private recommendationsService = inject(RecommendationsService);
  private searchService = inject(SearchService);
  private dialog = inject(MatDialog);

  subscriptionStatus = signal<SubscriptionStatus | null>(null);
  guestConsent = signal<GuestConsent | null>(null);

  houseHelps$!: Observable<any>;
  recommendations = signal<HouseHelpMatch[]>([]);
  recommendationsLoading = signal(false);
  recommendationsError = signal<string | null>(null);
  showAllCandidates = signal(false);
  activeTab = signal<'browse' | 'recommended'>('browse');

  page: number = 0;
  size: number = 20;
  type: string = 'ALL';
  searchQuery = '';

  get isLoggedIn() { return this.loginService.isLoggedIn(); }
  get isHomeOwner() { return this.loginService.userRoles().includes('ROLE_HOMEOWNER'); }

  ngOnInit() {
    const stored = sessionStorage.getItem(GUEST_CONSENT_KEY);
    if (stored) {
      try { this.guestConsent.set(JSON.parse(stored)); } catch { /* ignore */ }
    }

    this.route.paramMap.subscribe(params => {
      this.type = (params.get('type') || 'all').toUpperCase();
      this.load(this.type);
    });

    this.route.queryParamMap.subscribe(qp => {
      const skill = qp.get('skill');
      if (skill) { this.load(this.type); }
    });

    if (this.isHomeOwner) {
      this.loadRecommendations();
      this.searchService.getSubscriptionStatus().subscribe({
        next: (s) => this.subscriptionStatus.set(s),
        error: () => {},
      });
    }
  }

  openGuestConsentDialog(houseHelp?: any) {
    const ref = this.dialog.open(GuestConsentDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed().subscribe((consent: GuestConsent | null) => {
      if (consent) {
        this.guestConsent.set(consent);
        if (houseHelp) this.openGuestDetailsDialog(houseHelp);
      }
    });
  }

  openGuestDetailsDialog(houseHelp: any) {
    if (!this.guestConsent()) {
      this.openGuestConsentDialog(houseHelp);
      return;
    }
    this.dialog.open(UnlockDialogComponent, {
      data: {
        houseHelpId: houseHelp.id,
        previewName: houseHelp.user?.name?.split(' ')[0] || 'House Help',
        type: 'guest-profile',
        guestPhone: this.guestConsent()!.phoneNumber,
      },
      width: '580px',
      maxWidth: '95vw',
    });
  }

  goToSubscription() { this.router.navigate(['/subscription']); }

  loadRecommendations(): void {
    this.recommendationsLoading.set(true);
    this.recommendationsError.set(null);
    this.recommendationsService.getRecommendations(this.showAllCandidates()).subscribe({
      next: data => { this.recommendations.set(data ?? []); this.recommendationsLoading.set(false); },
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
    if (userId) this.router.navigate(['/edit-account', userId]);
  }

  toggleShowAllCandidates(): void {
    this.showAllCandidates.update(v => !v);
    this.loadRecommendations();
  }

  load(type: string) {
    const filter: any = {
      active: true,
      hiringStatus: 'AVAILABLE',
      houseHelpType: type === 'ALL' ? null : type,
    };
    if (this.searchQuery.trim()) filter.query = this.searchQuery.trim();
    this.houseHelps$ = this.househelpService.getAll(type, this.page, this.size, filter);
  }

  applySearch() { this.page = 0; this.load(this.type); }

  clearSearch() { this.searchQuery = ''; this.page = 0; this.load(this.type); }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.load(this.type);
  }

  seeDetails(id: number) { this.router.navigate(['/profile', id]); }

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
      .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getMatchScoreClass(score: number): string {
    if (score >= 80) return 'match-excellent';
    if (score >= 60) return 'match-good';
    return 'match-fair';
  }
}
