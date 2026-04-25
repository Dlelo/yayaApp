import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from '../login/login.service';
import { AccountDetailsService } from '../account-details/account-details.service';
import { catchError, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ReviewService, ReviewResponse, RatingSummary } from '../review/review.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [
    MatIconModule,
    MatCard,
    MatButton,
    MatIconButton,
    AsyncPipe,
    DatePipe,
    NgClass,
    MatFormFieldModule,
    MatInput,
    FormsModule,
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  private readonly router: Router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly reviewService = inject(ReviewService);

  houseHelpDetails$!: Observable<any>;
  reviews = signal<ReviewResponse[]>([]);
  ratingSummary = signal<RatingSummary>({ average: 0, count: 0 });
  houseHelpId = signal<number | null>(null);

  // Review form state
  newRating = 0;
  hoverRating = 0;
  newComment = '';
  submittingReview = false;

  get roles() { return this.loginService.userRoles(); }
  get isHomeOwner() { return this.roles.includes('ROLE_HOMEOWNER'); }

  ngOnInit(): void {
    this.houseHelpDetails$ = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        const idParam = params.get('id');
        if (!idParam || isNaN(Number(idParam))) {
          return of(null);
        }
        const id = Number(idParam);
        this.houseHelpId.set(id);
        this.loadReviews(id);
        return this.accountDetails.getHouseHelpDetails(id).pipe(
          catchError(() => of(null))
        );
      }),
      shareReplay(1)
    );
  }

  loadReviews(id: number): void {
    this.reviewService.getHouseHelpReviews(id).subscribe({
      next: reviews => this.reviews.set(reviews),
      error: () => {}
    });
    this.reviewService.getHouseHelpRatingSummary(id).subscribe({
      next: summary => this.ratingSummary.set(summary),
      error: () => {}
    });
  }

  setRating(rating: number): void {
    this.newRating = rating;
  }

  getStarArray(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  getStarsForRating(rating: number): { full: number; empty: number } {
    const full = Math.round(rating);
    return { full, empty: 5 - full };
  }

  submitReview(): void {
    if (this.newRating === 0) {
      this.snackBar.open('Please select a star rating.', 'Close', { duration: 3000 });
      return;
    }
    const id = this.houseHelpId();
    if (!id) return;

    this.submittingReview = true;
    this.reviewService.submitReview({
      revieweeId: id,
      revieweeType: 'HOUSE_HELP',
      rating: this.newRating,
      comment: this.newComment
    }).subscribe({
      next: review => {
        this.reviews.update(list => [review, ...list]);
        const total = this.ratingSummary().count + 1;
        const newAvg = Math.round(
          ((this.ratingSummary().average * this.ratingSummary().count) + review.rating) / total * 10
        ) / 10;
        this.ratingSummary.set({ average: newAvg, count: total });
        this.newRating = 0;
        this.newComment = '';
        this.submittingReview = false;
        this.snackBar.open('Review submitted successfully!', 'Close', { duration: 3000 });
      },
      error: err => {
        this.submittingReview = false;
        const msg = err?.error?.message || 'Failed to submit review. You may have already reviewed this person.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  navigateToPay(route: string): void {
    if (route === '/pay') {
      this.houseHelpDetails$.pipe(take(1)).subscribe(houseHelp => {
        if (!houseHelp) {
          this.snackBar.open('Unable to load house help details', 'Close', { duration: 3000 });
          return;
        }
        this.router.navigate(['/pay'], {
          queryParams: {
            id: houseHelp.id,
            name: houseHelp.user?.name || 'House Help',
            location: houseHelp.currentLocation || houseHelp.homeLocation || '',
            houseHelpType: houseHelp.houseHelpType || 'day-burg',
            inNairobi: houseHelp.inNairobi || false,
            countySurcharge: houseHelp.countySurcharge || 0,
            currentCounty: houseHelp.currentCounty || ''
          }
        });
      });
    } else {
      this.router.navigate([route]);
    }
  }

  navigateToHire(): void {
    this.houseHelpDetails$.pipe(take(1)).subscribe(houseHelp => {
      if (!houseHelp) {
        this.snackBar.open('Unable to load house help details', 'Close', { duration: 3000 });
        return;
      }
      this.router.navigate(['/hire'], {
        queryParams: {
          houseHelpId: houseHelp.id,
          name: houseHelp.user?.name || 'House Help',
        },
      });
    });
  }
}
