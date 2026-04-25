import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountDetailsService } from './account-details.service';
import { Observable, catchError, filter, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { LoginService } from '../login/login.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService, ReviewResponse } from '../review/review.service';

type TabKey = 'overview' | 'profile' | 'preferences' | 'documents' | 'hires' | 'payments' | 'reviews';

const CHILD_AGE_RANGE_LABELS: Record<string, string> = {
  MONTHS_0_5: '0–5 months',
  MONTHS_6_11: '6–11 months',
  YEAR_1: '1 year',
  YEAR_2: '2 years',
  YEAR_3: '3 years',
  YEARS_4_6: '4–6 years',
  YEARS_7_PLUS: '7+ years',
  '0': '0–5 months',
  '1': '6–11 months',
  '2': '1 year',
  '3': '2 years',
  '4': '3 years',
  '5': '4–6 years',
  '6': '7+ years',
};

const HOUSEHELP_TYPE_LABELS: Record<string, string> = {
  DAYBURG: 'Day burg',
  LIVE_IN: 'Live in',
  EMERGENCY: 'Emergency',
  EMERGENCY_LIVE_IN: 'Emergency live in',
  EMERGENCY_DAYBURG: 'Emergency day burg',
};

interface TabDef {
  key: TabKey;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatButton,
    MatIconButton,
    MatProgressSpinnerModule,
    AsyncPipe,
    DatePipe,
    DecimalPipe,
  ],
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly reviewService = inject(ReviewService);
  private readonly router = inject(Router);
  private readonly activatesRoute = inject(ActivatedRoute);

  userId: string | null = this.activatesRoute.snapshot.paramMap.get('id');

  readonly isOwnAccount = computed(
    () =>
      this.loginService.userId() !== null &&
      String(this.loginService.userId()) === this.userId
  );

  readonly currentRoles = this.loginService.userRoles;

  /** Set when the user details API responds — used by canEdit() to gate AGENT access. */
  private readonly targetCreatedById = signal<number | null>(null);

  /**
   * Edit access (FE-only — backend allows the existing role set):
   *   - ADMIN  → always
   *   - AGENT  → only if they registered the user (user.createdBy)
   *   - HOMEOWNER / HOUSEHELP → only on their own account
   */
  readonly canEdit = computed(() => {
    const roles = this.currentRoles();
    if (roles.includes('ROLE_ADMIN')) return true;
    if (roles.includes('ROLE_AGENT')) {
      const createdBy = this.targetCreatedById();
      const me = this.loginService.userId();
      return createdBy !== null && me !== null && createdBy === me;
    }
    if (roles.includes('ROLE_HOMEOWNER') || roles.includes('ROLE_HOUSEHELP')) {
      return this.isOwnAccount();
    }
    return false;
  });

  /** Tab state */
  readonly activeTab = signal<TabKey>('overview');

  myReviews: ReviewResponse[] = [];

  userDetails$!: Observable<UserDetails>;
  houseHelpDetails$!: Observable<HouseHelp>;
  homeOwnerDetails$!: Observable<HomeOwner>;
  avatarUrl$!: Observable<string | null>;
  hireHistory$!: Observable<HireRequest[]>;
  houseHelpHireRequests$!: Observable<HireRequest[]>;

  /** Payment history (homeowner-relevant; available for all users via the new endpoint) */
  payments = signal<PaymentRecord[]>([]);
  paymentsLoading = signal(false);
  paymentsError = signal<string | null>(null);

  readonly isHouseHelp = signal(false);
  readonly isHomeOwner = signal(false);

  readonly availableTabs = computed<TabDef[]>(() => {
    const tabs: TabDef[] = [
      { key: 'overview', label: 'Overview', icon: 'dashboard' },
      { key: 'profile', label: 'Profile', icon: 'badge' },
    ];
    if (this.isHouseHelp() || this.isHomeOwner()) {
      tabs.push({ key: 'preferences', label: 'Preferences', icon: 'tune' });
    }
    tabs.push({ key: 'documents', label: 'Documents', icon: 'folder' });
    if (this.isHouseHelp() || this.isHomeOwner()) {
      tabs.push({ key: 'hires', label: 'Hire Requests', icon: 'assignment' });
    }
    if (this.isHomeOwner()) {
      tabs.push({ key: 'payments', label: 'Payments', icon: 'receipt_long' });
    }
    if (this.isHouseHelp()) {
      tabs.push({ key: 'reviews', label: 'Reviews', icon: 'star' });
    }
    return tabs;
  });

  /** Quick stats shown in the overview hero. */
  readonly statsHouseHelp = signal<{ rating: number | null; reviews: number; experience: number }>(
    { rating: null, reviews: 0, experience: 0 }
  );
  readonly statsHomeOwner = signal<{ totalHires: number; totalSpent: number }>(
    { totalHires: 0, totalSpent: 0 }
  );

  private currentBlobUrl: string | null = null;
  private mapInstance: any = null;

  ngOnInit(): void {
    if (!this.userId) return;

    this.userDetails$ = this.accountDetails
      .getUserById(Number(this.userId))
      .pipe(
        tap((user: UserDetails) => {
          this.isHouseHelp.set(!!user?.roles?.includes('HOUSEHELP'));
          this.isHomeOwner.set(!!user?.roles?.includes('HOMEOWNER'));
          this.targetCreatedById.set(user?.createdById ?? null);
        }),
        shareReplay(1)
      );

    this.houseHelpDetails$ = this.userDetails$.pipe(
      filter((user) => user.roles.includes('HOUSEHELP')),
      filter((user) => !!user.houseHelp?.id),
      switchMap((user) => this.accountDetails.getHouseHelpDetails(user.houseHelp.id))
    );

    this.homeOwnerDetails$ = this.userDetails$.pipe(
      filter((user) => user.roles.includes('HOMEOWNER')),
      filter((user) => !!user.homeOwner?.id),
      switchMap((user) => this.accountDetails.getHomeOwnerDetails(user.homeOwner.id))
    );

    this.hireHistory$ = this.homeOwnerDetails$.pipe(
      switchMap((ho) =>
        this.accountDetails.getHomeOwnerHireHistory(ho.id).pipe(catchError(() => of([])))
      ),
      shareReplay(1)
    );

    this.houseHelpHireRequests$ = this.userDetails$.pipe(
      filter((user) => user.roles.includes('HOUSEHELP')),
      switchMap((user) =>
        this.accountDetails.getHouseHelpHireRequests(user.id).pipe(catchError(() => of([])))
      ),
      shareReplay(1)
    );

    this.houseHelpDetails$.subscribe((hh) => {
      if (hh?.id) {
        this.reviewService.getHouseHelpReviews(hh.id).subscribe({
          next: (reviews) => {
            this.myReviews = reviews;
            const total = reviews.length;
            const avg = total
              ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total
              : null;
            this.statsHouseHelp.set({
              rating: avg,
              reviews: total,
              experience: hh.yearsOfExperience ?? 0,
            });
          },
          error: () => {},
        });
      }
      if (hh?.pinLocation?.latitude && hh?.pinLocation?.longitude) {
        setTimeout(
          () =>
            this.initMap(hh.pinLocation!.latitude, hh.pinLocation!.longitude, hh.pinLocation!.placeName),
          200
        );
      }
    });

    this.homeOwnerDetails$.subscribe((ho) => {
      if (ho?.pinLocation?.latitude && ho?.pinLocation?.longitude) {
        setTimeout(
          () =>
            this.initMap(ho.pinLocation!.latitude, ho.pinLocation!.longitude, ho.pinLocation!.placeName),
          200
        );
      }
    });

    this.hireHistory$.subscribe((list) => {
      this.statsHomeOwner.update((s) => ({ ...s, totalHires: list.length }));
    });

    // Lazy-load payments only when the tab is opened — see selectTab().
    this.userDetails$.subscribe(() => {
      // Pre-fetch lightly so the homeowner overview stat is accurate.
      this.fetchPayments();
    });

    this.avatarUrl$ = this.userDetails$.pipe(
      map(
        (user) =>
          user?.houseHelp?.profilePictureDocument ||
          user?.homeOwner?.profilePictureDocument ||
          null
      ),
      switchMap((url) => {
        if (!url) return of(null);
        if (url.startsWith('data:') || url.startsWith('blob:')) return of(url);
        if (url.includes('cdn.digitaloceanspaces.com')) return of(url);
        return this.accountDetails.fetchPrivateImage(url).pipe(
          catchError((err) => {
            console.error('Failed to load avatar', err);
            return of(null);
          })
        );
      }),
      map((url) => {
        if (url && url.startsWith('blob:')) this.currentBlobUrl = url;
        return url;
      }),
      shareReplay(1)
    );
  }

  ngOnDestroy(): void {
    if (this.currentBlobUrl) {
      this.accountDetails.revokeBlobUrl(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  selectTab(tab: TabKey): void {
    this.activeTab.set(tab);
    if (tab === 'payments' && this.payments().length === 0 && !this.paymentsLoading()) {
      this.fetchPayments();
    }
  }

  private fetchPayments(): void {
    if (!this.userId) return;
    this.paymentsLoading.set(true);
    this.paymentsError.set(null);
    this.accountDetails.getUserPayments(Number(this.userId)).subscribe({
      next: (list) => {
        this.payments.set(list ?? []);
        const totalSpent = (list ?? [])
          .filter((p) => p.status === 'SUCCESS')
          .reduce((s, p) => s + (p.amount || 0), 0);
        this.statsHomeOwner.update((s) => ({ ...s, totalSpent }));
        this.paymentsLoading.set(false);
      },
      error: (err) => {
        this.paymentsError.set(
          err?.status === 403 ? 'Not authorized to view this user\'s payments.' : 'Could not load payments.'
        );
        this.paymentsLoading.set(false);
      },
    });
  }

  private async initMap(lat: number, lng: number, label?: string): Promise<void> {
    const el = document.getElementById('account-map');
    if (!el) return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    const L = (await import('leaflet')).default;

    this.mapInstance = L.map('account-map', { zoomControl: true, scrollWheelZoom: false }).setView(
      [lat, lng],
      14
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.mapInstance);

    const icon = L.icon({
      iconUrl: 'marker-icon.png',
      shadowUrl: 'marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    L.marker([lat, lng], { icon })
      .addTo(this.mapInstance)
      .bindPopup(label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
      .openPopup();
  }

  editAccount(userID: string): void {
    this.router.navigate(['/edit-account/', Number(userID)]);
  }

  changePassword(): void {
    this.router.navigate(['/change-password']);
  }

  goToMyHires(): void {
    this.router.navigate(['/my-hires']);
  }

  viewDocument(documentUrl: string | null): void {
    if (documentUrl) window.open(documentUrl, '_blank');
  }

  statusClass(status: string | undefined | null): string {
    if (!status) return '';
    return `pill-${status.toLowerCase()}`;
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  /** Convert an enum-style token (e.g. "PRAY_WITH_CHILD") into "Pray with child". */
  prettyLabel(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .toString()
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  houseHelpTypeLabel(v: string | string[] | null | undefined): string {
    if (!v) return '';
    if (Array.isArray(v)) return v.map((x) => HOUSEHELP_TYPE_LABELS[x] ?? this.prettyLabel(x)).join(', ');
    return HOUSEHELP_TYPE_LABELS[v] ?? this.prettyLabel(v);
  }

  childAgeRangeLabel(v: string | number): string {
    const key = String(v);
    return CHILD_AGE_RANGE_LABELS[key] ?? this.prettyLabel(key);
  }

  hasValue(v: unknown): boolean {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }

  salaryRange(min?: number | null, max?: number | null): string {
    if (min && max) return `KES ${min.toLocaleString()} – ${max.toLocaleString()}`;
    if (min) return `From KES ${min.toLocaleString()}`;
    if (max) return `Up to KES ${max.toLocaleString()}`;
    return '—';
  }

  ageRange(min?: number | null, max?: number | null): string {
    if (min && max) return `${min} – ${max} yrs`;
    if (min) return `${min}+ yrs`;
    if (max) return `Up to ${max} yrs`;
    return '—';
  }
}
