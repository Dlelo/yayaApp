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

  userDetails$!: Observable<UserDetails>;
  houseHelpDetails$!: Observable<HouseHelp>;
  homeOwnerDetails$!: Observable<HomeOwner>;
  avatarUrl$!: Observable<string | null>;

  /** Hire history for homeowner */
  hireHistory$!: Observable<HireRequest[]>;

  /** Hire requests received by a househelp (uses User ID since HireRequest.houseHelp is a User) */
  houseHelpHireRequests$!: Observable<HireRequest[]>;

  private currentBlobUrl: string | null = null;
  private mapInstance: any = null;

  ngOnInit(): void {
    if (!this.userId) return;

    this.userDetails$ = this.accountDetails
      .getUserById(Number(this.userId))
      .pipe(shareReplay(1));

    this.houseHelpDetails$ = this.userDetails$.pipe(
      filter(user => user.roles.includes('HOUSEHELP')),
      filter(user => !!user.houseHelp?.id),
      switchMap(user =>
        this.accountDetails.getHouseHelpDetails(user.houseHelp.id)
      )
    );

    this.homeOwnerDetails$ = this.userDetails$.pipe(
      filter(user => user.roles.includes('HOMEOWNER')),
      filter(user => !!user.homeOwner?.id),
      switchMap(user =>
        this.accountDetails.getHomeOwnerDetails(user.homeOwner.id)
      )
    );

    this.hireHistory$ = this.homeOwnerDetails$.pipe(
      switchMap(ho =>
        this.accountDetails.getHomeOwnerHireHistory(ho.id).pipe(
          catchError(() => of([]))
        )
      )
    );

    // HireRequest.houseHelp stores User ID, so pass the user's own ID
    this.houseHelpHireRequests$ = this.userDetails$.pipe(
      filter(user => user.roles.includes('HOUSEHELP')),
      switchMap(user =>
        this.accountDetails.getHouseHelpHireRequests(user.id).pipe(
          catchError(() => of([]))
        )
      )
    );

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

    this.homeOwnerDetails$.subscribe(ho => {
      if (ho?.pinLocation?.latitude && ho?.pinLocation?.longitude) {
        setTimeout(() => this.initMap(ho.pinLocation!.latitude, ho.pinLocation!.longitude, ho.pinLocation!.placeName), 200);
      }
    });

    this.avatarUrl$ = this.userDetails$.pipe(
      map(user =>
        user?.houseHelp?.profilePictureDocument ||
        user?.homeOwner?.profilePictureDocument ||
        null
      ),
      switchMap(url => {
        if (!url) return of(null);
        if (url.startsWith('data:') || url.startsWith('blob:')) return of(url);
        if (url.includes('cdn.digitaloceanspaces.com')) return of(url);
        return this.accountDetails.fetchPrivateImage(url).pipe(
          catchError(err => {
            console.error('Failed to load avatar', err);
            return of(null);
          })
        );
      }),
      map(url => {
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
    if (documentUrl) window.open(documentUrl, '_blank');
  }
}
