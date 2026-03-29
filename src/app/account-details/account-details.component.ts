import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { AccountDetailsService } from './account-details.service';
import { Observable, catchError, filter, map, of, shareReplay, switchMap } from 'rxjs';
import { LoginService } from '../login/login.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService, ReviewResponse } from '../review/review.service';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatButton,
    MatIconButton,
    AsyncPipe,
  ],
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly reviewService = inject(ReviewService);
  private readonly router = inject(Router);
  private readonly activatesRoute = inject(ActivatedRoute);

  userId: string | null = this.activatesRoute.snapshot.paramMap.get('id');

  /** True when the logged-in user is viewing their own account */
  readonly isOwnAccount = computed(() =>
    this.loginService.userId() !== null &&
    String(this.loginService.userId()) === this.userId
  );

  readonly currentRoles = this.loginService.userRoles;

  /** Can edit = ADMIN/SALES, or house help viewing their own account */
  readonly canEdit = computed(() => {
    const roles = this.currentRoles();
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SALES')) return true;
    if (roles.includes('ROLE_HOUSEHELP') && this.isOwnAccount()) return true;
    return false;
  });

  myReviews: ReviewResponse[] = [];

  /** Primary stream */
  userDetails$!: Observable<UserDetails>;

  /** Derived streams */
  houseHelpDetails$!: Observable<HouseHelp>;
  homeOwnerDetails$!: Observable<HomeOwner>;

  /** Avatar stream that supports auth-protected buckets */
  avatarUrl$!: Observable<string | null>;

  // Store current blob URL for cleanup
  private currentBlobUrl: string | null = null;
  private mapInstance: any = null;

  ngOnInit(): void {
    if (!this.userId) return;

    /** Fetch user ONCE */
    this.userDetails$ = this.accountDetails
      .getUserById(Number(this.userId))
      .pipe(shareReplay(1));

    /** HouseHelp details */
    this.houseHelpDetails$ = this.userDetails$.pipe(
      filter(user => user.roles.includes('HOUSEHELP')),
      filter(user => !!user.houseHelp?.id),
      switchMap(user =>
        this.accountDetails.getHouseHelpDetails(user.houseHelp.id)
      )
    );

    /** HomeOwner details */
    this.homeOwnerDetails$ = this.userDetails$.pipe(
      filter(user => user.roles.includes('HOMEOWNER')),
      filter(user => !!user.homeOwner?.id),
      switchMap(user =>
        this.accountDetails.getHomeOwnerDetails(user.homeOwner.id)
      )
    );

    /** Load reviews + map when user is a house help */
    this.houseHelpDetails$.subscribe(hh => {
      if (hh?.id) {
        this.reviewService.getHouseHelpReviews(hh.id).subscribe({
          next: (reviews) => this.myReviews = reviews,
          error: () => {}
        });
      }
      if (hh?.pinLocation?.latitude && hh?.pinLocation?.longitude) {
        setTimeout(() => this.initMap(hh.pinLocation!.latitude, hh.pinLocation!.longitude, hh.pinLocation!.placeName), 200);
      }
    });

    /** Map for homeowner */
    this.homeOwnerDetails$.subscribe(ho => {
      if (ho?.pinLocation?.latitude && ho?.pinLocation?.longitude) {
        setTimeout(() => this.initMap(ho.pinLocation!.latitude, ho.pinLocation!.longitude, ho.pinLocation!.placeName), 200);
      }
    });

    /**
     * Resolve avatar image (handles both public CDN and private buckets)
     * For public CDN URLs: returns URL directly
     * For private/auth-protected URLs: fetches as blob
     */
    this.avatarUrl$ = this.userDetails$.pipe(
      map(user =>
        user?.houseHelp?.profilePictureDocument ||
        user?.homeOwner?.profilePictureDocument ||
        null
      ),
      switchMap(url => {
        // No URL provided
        if (!url) return of(null);
        
        // Already a blob or data URL
        if (url.startsWith('data:') || url.startsWith('blob:')) {
          return of(url);
        }
        
        // Public CDN URL - use directly (faster, no extra request)
        if (url.includes('cdn.digitaloceanspaces.com')) {
          return of(url);
        }
        
        // Private/auth-protected URL - fetch as blob
        return this.accountDetails.fetchPrivateImage(url).pipe(
          catchError(err => {
            console.error('Failed to load avatar', err);
            return of(null);
          })
        );
      }),
      // Store blob URL for cleanup
      map(url => {
        if (url && url.startsWith('blob:')) {
          this.currentBlobUrl = url;
        }
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

  private async initMap(lat: number, lng: number, label?: string): Promise<void> {
    const el = document.getElementById('account-map');
    if (!el) return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    const L = (await import('leaflet')).default;

    this.mapInstance = L.map('account-map', { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
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

  viewDocument(documentUrl: string | null): void {
    // Open document in new tab
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  }
}
