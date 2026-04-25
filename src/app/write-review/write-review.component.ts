import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReviewService } from '../review/review.service';
import { HapticsService } from '../core/haptics.service';

@Component({
  selector: 'app-write-review',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './write-review.component.html',
  styleUrls: ['./write-review.component.scss'],
})
export class WriteReviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly reviewService = inject(ReviewService);
  private readonly snack = inject(MatSnackBar);
  private readonly haptics = inject(HapticsService);

  houseHelpId: number | null = null;
  houseHelpName = 'this house help';

  rating = signal(0);
  hover = signal(0);
  submitting = signal(false);
  stars = [1, 2, 3, 4, 5];

  form: FormGroup = this.fb.group({
    comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.houseHelpId = idParam ? Number(idParam) : null;
    this.houseHelpName = this.route.snapshot.queryParamMap.get('name') ?? this.houseHelpName;
  }

  setRating(value: number): void {
    this.rating.set(value);
    void this.haptics.impact('Light');
  }

  onHover(value: number): void {
    this.hover.set(value);
  }

  clearHover(): void {
    this.hover.set(0);
  }

  starState(index: number): 'filled' | 'empty' {
    const ref = this.hover() || this.rating();
    return index <= ref ? 'filled' : 'empty';
  }

  submit(): void {
    if (!this.houseHelpId) {
      this.snack.open('Missing house help reference.', 'Close', { duration: 3000 });
      return;
    }
    if (this.rating() < 1) {
      this.snack.open('Please pick a rating from 1 to 5 stars.', 'Close', { duration: 3000 });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.reviewService
      .submitReview({
        revieweeId: this.houseHelpId,
        revieweeType: 'HOUSE_HELP',
        rating: this.rating(),
        comment: this.form.value.comment,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          void this.haptics.success();
          this.snack.open('Thanks for your review!', 'OK', { duration: 3000 });
          this.router.navigate(['/my-hires']);
        },
        error: (err) => {
          this.submitting.set(false);
          void this.haptics.error();
          const msg =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message || 'Could not submit your review.';
          this.snack.open(msg, 'Close', { duration: 4000 });
        },
      });
  }
}
