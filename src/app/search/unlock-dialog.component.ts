import { Component, inject, Inject, OnDestroy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../pay/pay.service';
import { SearchService, HouseHelpFullDetails } from './search.service';
import { ReviewService, ReviewResponse, RatingSummary } from '../review/review.service';

/** 'phone'         — logged-in user pays KES 500 to reveal phone number
 *  'guest-profile' — guest pays KES 250 to view full profile (no phone, no ID)
 *  'pdf'           — any user pays KES 250 to download a PDF
 */
export type UnlockType = 'phone' | 'guest-profile' | 'pdf';

type DialogState = 'confirm' | 'payment' | 'processing' | 'result';

export interface UnlockDialogData {
  houseHelpId: number;
  previewName: string;
  type: UnlockType;
  guestPhone?: string; // pre-filled M-Pesa number for guests (from consent form)
}

const AMOUNTS: Record<UnlockType, number> = {
  phone: 500,
  'guest-profile': 250,
  pdf: 250,
};

const LABELS: Record<UnlockType, string> = {
  phone: 'View Phone Number',
  'guest-profile': 'View Full Profile',
  pdf: 'Download PDF',
};

@Component({
  selector: 'app-unlock-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, ReactiveFormsModule, DatePipe, DecimalPipe,
  ],
  template: `
    <div class="unlock-dialog">

      <!-- CONFIRM STATE -->
      @if (state() === 'confirm') {
        <h2 mat-dialog-title>
          @switch (data.type) {
            @case ('phone') { View Phone Number }
            @case ('guest-profile') { View Full Profile }
            @case ('pdf') { Download PDF Profile }
          }
        </h2>
        <mat-dialog-content>
          <div class="confirm-info">
            @switch (data.type) {
              @case ('phone') {
                <mat-icon class="confirm-icon">phone_locked</mat-icon>
                <p>Pay <strong>KSh 500</strong> via M-Pesa to view the phone number of <strong>{{ data.previewName }}</strong>.</p>
                <p class="confirm-note">This is a one-time unlock. The number will be visible on this profile going forward.</p>
              }
              @case ('guest-profile') {
                <mat-icon class="confirm-icon">person_search</mat-icon>
                <p>Pay <strong>KSh 250</strong> via M-Pesa to view the full profile details of <strong>{{ data.previewName }}</strong>.</p>
                <p class="confirm-note">Phone number and National ID are not included and are never disclosed. You will see skills, experience, reviews, and verification badges.</p>
              }
              @case ('pdf') {
                <mat-icon class="confirm-icon">picture_as_pdf</mat-icon>
                <p>Pay <strong>KSh 250</strong> via M-Pesa to download a PDF of <strong>{{ data.previewName }}'s</strong> profile.</p>
                <p class="confirm-note">The PDF will not contain phone number or National ID.</p>
              }
            }
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="close()">Cancel</button>
          <button mat-flat-button (click)="state.set('payment')">
            Proceed to Payment <mat-icon>arrow_forward</mat-icon>
          </button>
        </mat-dialog-actions>
      }

      <!-- PAYMENT STATE -->
      @if (state() === 'payment') {
        <h2 mat-dialog-title>{{ LABELS[data.type] }} — KSh {{ AMOUNTS[data.type] }}</h2>
        <mat-dialog-content>
          <p class="pay-info">Enter the M-Pesa number to receive the payment prompt.</p>
          <mat-form-field appearance="outline" class="full-field">
            <mat-label>M-Pesa Phone Number</mat-label>
            <mat-icon matPrefix>phone</mat-icon>
            <input matInput [formControl]="phoneControl" placeholder="07XXXXXXXX or +254XXXXXXXXX" type="tel" />
            @if (phoneControl.hasError('required') && phoneIsTouched) {
              <mat-error>Phone number is required</mat-error>
            }
            @if (phoneControl.hasError('pattern')) {
              <mat-error>Enter a valid Kenyan phone number</mat-error>
            }
          </mat-form-field>
          @if (errorMsg()) {
            <p class="error-msg">{{ errorMsg() }}</p>
          }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="state.set('confirm')">Back</button>
          <button mat-flat-button [disabled]="phoneControl.invalid" (click)="pay()">
            <mat-icon>payment</mat-icon> Pay KSh {{ AMOUNTS[data.type] }}
          </button>
        </mat-dialog-actions>
      }

      <!-- PROCESSING STATE -->
      @if (state() === 'processing') {
        <h2 mat-dialog-title>Waiting for Payment</h2>
        <mat-dialog-content class="processing-content">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Check your phone and enter your M-Pesa PIN to complete the payment.</p>
          <p class="hint">This may take up to 60 seconds…</p>
        </mat-dialog-content>
      }

      <!-- RESULT: PHONE -->
      @if (state() === 'result' && data.type === 'phone' && phoneNumber()) {
        <h2 mat-dialog-title>Phone Number Unlocked</h2>
        <mat-dialog-content class="result-content no-select" (contextmenu)="$event.preventDefault()">
          <div class="phone-reveal">
            <mat-icon class="phone-icon">phone</mat-icon>
            <div>
              <p class="phone-label">{{ data.previewName }}'s Phone Number</p>
              <a class="phone-number" [href]="'tel:' + phoneNumber()">{{ phoneNumber() }}</a>
            </div>
          </div>
          <p class="result-note">You can also find this number on the profile page anytime.</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="close()">Close</button>
        </mat-dialog-actions>
      }

      <!-- RESULT: GUEST PROFILE -->
      @if (state() === 'result' && data.type === 'guest-profile' && details()) {
        <h2 mat-dialog-title>{{ details()!.name }}</h2>
        <mat-dialog-content class="details-content no-select no-print" (contextmenu)="$event.preventDefault()">

          @if (details()!.profilePictureDocument) {
            <img [src]="details()!.profilePictureDocument" class="profile-pic" alt="Profile" />
          } @else {
            <div class="profile-pic-placeholder"><mat-icon>person</mat-icon></div>
          }

          <!-- Verification badges — never show National ID -->
          <div class="badges-row">
            @if (details()!.identityVerified) {
              <span class="badge badge-verified"><mat-icon>verified_user</mat-icon> Identity Verified by YayaConnect</span>
            }
            @if (details()!.goodConductVerified) {
              <span class="badge badge-verified"><mat-icon>gavel</mat-icon> Good Conduct Verified</span>
            }
            @if (details()!.medicalReportVerified) {
              <span class="badge badge-verified"><mat-icon>medical_services</mat-icon> Medical Report Verified</span>
            }
            @if (details()!.securityCleared) {
              <span class="badge badge-security"><mat-icon>shield</mat-icon> Security Cleared</span>
            }
            @if (details()!.verified) {
              <span class="badge badge-active"><mat-icon>check_circle</mat-icon> Verified by YayaConnect</span>
            }
          </div>

          <!-- Phone number intentionally omitted per DPA compliance -->
          <div class="details-grid">
            @if (details()!.currentLocation) {
              <div class="detail-item"><mat-icon>location_on</mat-icon><div><strong>Location</strong><span>{{ details()!.currentLocation }}</span></div></div>
            }
            @if (details()!.yearsOfExperience) {
              <div class="detail-item"><mat-icon>work_history</mat-icon><div><strong>Experience</strong><span>{{ details()!.yearsOfExperience }} years</span></div></div>
            }
            @if (details()!.age) {
              <div class="detail-item"><mat-icon>cake</mat-icon><div><strong>Age</strong><span>{{ details()!.age }}</span></div></div>
            }
            @if (details()!.gender) {
              <div class="detail-item"><mat-icon>person</mat-icon><div><strong>Gender</strong><span>{{ details()!.gender }}</span></div></div>
            }
            @if (details()!.availability) {
              <div class="detail-item"><mat-icon>schedule</mat-icon><div><strong>Availability</strong><span>{{ details()!.availability }}</span></div></div>
            }
            @if (details()!.levelOfEducation) {
              <div class="detail-item"><mat-icon>school</mat-icon><div><strong>Education</strong><span>{{ details()!.levelOfEducation }}</span></div></div>
            }
            @if (details()!.religion) {
              <div class="detail-item"><mat-icon>church</mat-icon><div><strong>Religion</strong><span>{{ details()!.religion }}</span></div></div>
            }
            @if (details()!.houseHelpType) {
              <div class="detail-item"><mat-icon>home</mat-icon><div><strong>Type</strong><span>{{ details()!.houseHelpType.replace('_', ' ') }}</span></div></div>
            }
          </div>

          @if (details()!.languages?.length) {
            <div class="detail-section"><strong>Languages</strong>
              <div class="tags">@for (l of details()!.languages; track l) { <span class="tag">{{ l }}</span> }</div>
            </div>
          }

          @if (details()!.skills?.length) {
            <div class="detail-section"><strong>Skills</strong>
              <div class="tags">@for (s of details()!.skills; track s) { <span class="tag">{{ s.replace('_', ' ') }}</span> }</div>
            </div>
          }

          @if (details()!.experienceSummary) {
            <div class="detail-section"><strong>About</strong><p>{{ details()!.experienceSummary }}</p></div>
          }

          <!-- Reviews -->
          @if (ratingSummary().count > 0 || reviews().length > 0) {
            <div class="detail-section reviews-section">
              <strong>Reviews
                @if (ratingSummary().count > 0) { ({{ ratingSummary().count }}) — avg {{ ratingSummary().average | number:'1.1-1' }} / 5 }
              </strong>
              @if (reviews().length > 0) {
                <ul class="review-list">
                  @for (r of reviews(); track r.id) {
                    <li class="review-item">
                      <div class="review-head">
                        <strong>{{ r.reviewerName }}</strong>
                        <span class="review-date">{{ r.createdAt | date:'mediumDate' }}</span>
                        <span class="review-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
                      </div>
                      @if (r.comment) { <p class="review-comment">{{ r.comment }}</p> }
                    </li>
                  }
                </ul>
              } @else {
                <p class="no-reviews">No reviews yet.</p>
              }
            </div>
          } @else {
            <div class="detail-section">
              <strong>Reviews</strong>
              <p class="no-reviews">No reviews yet.</p>
            </div>
          }

          <p class="dpa-note">
            <mat-icon>info</mat-icon>
            Phone number and National ID are protected under Kenya's Data Protection Act and are never disclosed.
          </p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="close()">Close</button>
        </mat-dialog-actions>
      }

      <!-- RESULT: PDF SUCCESS -->
      @if (state() === 'result' && data.type === 'pdf') {
        <h2 mat-dialog-title>PDF Downloaded</h2>
        <mat-dialog-content class="result-content">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <p>The PDF profile for <strong>{{ data.previewName }}</strong> has been downloaded to your device.</p>
          <p class="confirm-note">The PDF does not contain phone number or National ID.</p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-flat-button (click)="close()">Done</button>
        </mat-dialog-actions>
      }

    </div>
  `,
  styles: [`
    .unlock-dialog { min-width: 340px; max-width: 580px; }
    .confirm-info { display: flex; flex-direction: column; align-items: center; text-align: center; padding: .5rem 0 .25rem; gap: .5rem;
      p { color: #334155; font-size: .9rem; line-height: 1.5; margin: 0; }
    }
    .confirm-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #6366f1; margin-bottom: .25rem; }
    .confirm-note { color: #64748b !important; font-size: .8rem !important; }
    .full-field { width: 100%; margin-top: .5rem; }
    .pay-info { color: #475569; margin-bottom: 1rem; }
    .error-msg { color: #ef4444; font-size: .875rem; margin-top: .5rem; }
    .processing-content { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem 0; text-align: center; .hint { color: #94a3b8; font-size: .875rem; } }
    .result-content { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 1rem 0; text-align: center; p { color: #334155; font-size: .9rem; } }
    .success-icon { font-size: 3rem; width: 3rem; height: 3rem; color: #16a34a; }
    .phone-reveal { display: flex; align-items: center; gap: 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 1rem 1.5rem; }
    .phone-icon { font-size: 2rem; width: 2rem; height: 2rem; color: #16a34a; }
    .phone-label { font-size: .8rem; color: #64748b; margin: 0 0 .2rem; }
    .phone-number { font-size: 1.25rem; font-weight: 700; color: #15803d; text-decoration: none; &:hover { text-decoration: underline; } }
    .result-note { color: #64748b; font-size: .8rem; }
    .details-content { max-height: 70vh; overflow-y: auto; }
    .profile-pic { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto .75rem; }
    .profile-pic-placeholder { width: 72px; height: 72px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; margin: 0 auto .75rem; mat-icon { font-size: 2.5rem; color: #94a3b8; } }
    .badges-row { display: flex; flex-wrap: wrap; gap: .4rem; justify-content: center; margin-bottom: 1rem; }
    .badge { display: inline-flex; align-items: center; gap: .25rem; padding: .25rem .6rem; border-radius: 20px; font-size: .75rem; font-weight: 600; mat-icon { font-size: .9rem; width: .9rem; height: .9rem; } }
    .badge-verified { background: #dcfce7; color: #15803d; }
    .badge-security { background: #dbeafe; color: #1d4ed8; }
    .badge-active { background: #fef9c3; color: #854d0e; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-bottom: 1rem; }
    .detail-item { display: flex; align-items: flex-start; gap: .5rem; mat-icon { color: #6366f1; flex-shrink: 0; margin-top: 2px; } div { display: flex; flex-direction: column; strong { font-size: .75rem; color: #64748b; } span { font-size: .9rem; color: #1e293b; } } }
    .detail-section { margin-bottom: .75rem; strong { font-size: .8rem; color: #64748b; display: block; margin-bottom: .35rem; } p { color: #334155; font-size: .9rem; margin: 0; } }
    .tags { display: flex; flex-wrap: wrap; gap: .3rem; }
    .tag { background: #f1f5f9; color: #334155; padding: .2rem .55rem; border-radius: 12px; font-size: .8rem; }
    .reviews-section { border-top: 1px solid #e2e8f0; padding-top: .75rem; }
    .review-list { list-style: none; padding: 0; margin: .5rem 0 0; display: flex; flex-direction: column; gap: .75rem; }
    .review-item { background: #f8fafc; border-radius: 8px; padding: .6rem .75rem; }
    .review-head { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; strong { font-size: .875rem; } }
    .review-date { font-size: .75rem; color: #94a3b8; }
    .review-stars { color: #f59e0b; font-size: .85rem; margin-left: auto; }
    .review-comment { margin: .35rem 0 0; font-size: .85rem; color: #475569; }
    .no-reviews { color: #94a3b8; font-size: .85rem; font-style: italic; }
    .dpa-note { display: flex; align-items: center; gap: .4rem; font-size: .78rem; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: .5rem .75rem; margin-top: .5rem; mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #6366f1; flex-shrink: 0; } }
    .no-select { user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
    @media print { * { display: none !important; } }
  `],
})
export class UnlockDialogComponent implements OnDestroy {
  readonly AMOUNTS = AMOUNTS;
  readonly LABELS = LABELS;

  private dialogRef = inject(MatDialogRef<UnlockDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private paymentService = inject(PaymentService);
  private searchService = inject(SearchService);
  private reviewService = inject(ReviewService);

  state = signal<DialogState>('confirm');
  details = signal<HouseHelpFullDetails | null>(null);
  phoneNumber = signal<string>('');
  reviews = signal<ReviewResponse[]>([]);
  ratingSummary = signal<RatingSummary>({ average: 0, count: 0 });
  errorMsg = signal('');

  phoneControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^(\+254|254|0)[17]\d{8}$/),
  ]);

  get phoneIsTouched() { return this.phoneControl.touched; }

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastPaymentRef = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: UnlockDialogData) {
    if (data.guestPhone) {
      let pre = data.guestPhone;
      if (pre.startsWith('+254')) pre = '0' + pre.slice(4);
      else if (pre.startsWith('254')) pre = '0' + pre.slice(3);
      this.phoneControl.setValue(pre);
    }
  }

  ngOnDestroy() { this.clearPoll(); }

  pay() {
    if (this.phoneControl.invalid) return;

    let phone = this.phoneControl.value!;
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    else if (phone.startsWith('+')) phone = phone.slice(1);

    const storedUser = localStorage.getItem('user');
    const email = storedUser ? JSON.parse(storedUser)?.email : null;

    this.state.set('processing');
    this.errorMsg.set('');

    this.paymentService.initiateStkPush({
      phoneNumber: phone,
      amount: AMOUNTS[this.data.type],
      accountReference: `${this.data.type.toUpperCase()}-${this.data.houseHelpId}`,
      transactionDesc: `${LABELS[this.data.type]} — ${this.data.previewName}`,
      ...(email ? { email } : {}),
    } as any).subscribe({
      next: (res) => {
        const checkoutId = res?.checkoutRequestId || res?.CheckoutRequestID;
        this.lastPaymentRef = checkoutId || '';
        if (checkoutId) {
          this.snackBar.open('M-Pesa prompt sent! Enter your PIN on your phone.', 'OK', { duration: 6000 });
          this.startPolling(checkoutId);
        } else {
          this.onPaymentConfirmed('');
        }
      },
      error: () => {
        this.state.set('payment');
        this.errorMsg.set('Payment initiation failed. Please try again.');
      },
    });
  }

  private startPolling(checkoutId: string) {
    let attempts = 0;
    this.pollTimer = setInterval(() => {
      attempts++;
      this.paymentService.checkPaymentStatus(checkoutId).subscribe({
        next: (status) => {
          if (status.status === 'SUCCESS') {
            this.clearPoll();
            this.onPaymentConfirmed(checkoutId);
          } else if (status.status === 'FAILED') {
            this.clearPoll();
            this.state.set('payment');
            this.errorMsg.set('Payment failed. Please try again.');
          }
        },
        error: () => {},
      });
      if (attempts >= 20) {
        this.clearPoll();
        this.onPaymentConfirmed(checkoutId);
      }
    }, 3000);
  }

  private onPaymentConfirmed(paymentRef: string) {
    switch (this.data.type) {
      case 'phone':
        this.searchService.unlockPhone(this.data.houseHelpId).subscribe({
          next: () => this.loadPhoneNumber(),
          error: () => this.loadPhoneNumber(),
        });
        break;

      case 'guest-profile':
        this.searchService.guestGetFullDetails(this.data.houseHelpId, paymentRef).subscribe({
          next: (d) => {
            this.details.set(d);
            this.loadReviews();
            this.state.set('result');
          },
          error: () => {
            this.state.set('payment');
            this.errorMsg.set('Could not load profile details. Please contact support.');
          },
        });
        break;

      case 'pdf':
        this.searchService.downloadProfilePdf(this.data.houseHelpId, paymentRef).subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.data.previewName.replace(/\s+/g, '_')}_YayaConnect.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            this.state.set('result');
          },
          error: () => {
            this.state.set('payment');
            this.errorMsg.set('Could not generate PDF. Please contact support.');
          },
        });
        break;
    }
  }

  private loadPhoneNumber() {
    this.searchService.getPhoneNumber(this.data.houseHelpId).subscribe({
      next: (res) => { this.phoneNumber.set(res.phoneNumber); this.state.set('result'); },
      error: () => {
        this.state.set('payment');
        this.errorMsg.set('Could not retrieve phone number. Please contact support.');
      },
    });
  }

  private loadReviews() {
    this.reviewService.getHouseHelpReviews(this.data.houseHelpId).subscribe({
      next: (r) => this.reviews.set(r),
      error: () => {},
    });
    this.reviewService.getHouseHelpRatingSummary(this.data.houseHelpId).subscribe({
      next: (s) => this.ratingSummary.set(s),
      error: () => {},
    });
  }

  close() {
    // Return phone number to the caller so the profile page can display it without a re-fetch
    this.dialogRef.close(this.data.type === 'phone' ? this.phoneNumber() || null : null);
  }
  private clearPoll() { if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; } }
}
