import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatCard } from '@angular/material/card';
import { AsyncPipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { AccountDetailsService } from './account-details.service';
import { Observable, catchError, filter, map, of, shareReplay, switchMap, take } from 'rxjs';
import { LoginService } from '../login/login.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  standalone: true,
  imports: [
    MatDivider,
    MatIconModule,
    MatCard,
    NgClass,
    MatButton,
    AsyncPipe,
  ],
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly router = inject(Router);
  private readonly activatesRoute = inject(ActivatedRoute);

  userId: string | null = this.activatesRoute.snapshot.paramMap.get('id');

  /** Primary stream */
  userDetails$!: Observable<UserDetails>;

  /** Derived streams */
  houseHelpDetails$!: Observable<HouseHelp>;
  homeOwnerDetails$!: Observable<HomeOwner>;

  /** Avatar stream that supports auth-protected buckets */
  avatarUrl$!: Observable<string | null>;

  // Store current blob URL for cleanup
  private currentBlobUrl: string | null = null;

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
    // Clean up blob URL to prevent memory leaks
    if (this.currentBlobUrl) {
      this.accountDetails.revokeBlobUrl(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
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
