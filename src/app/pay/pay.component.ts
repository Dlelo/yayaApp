import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from './pay.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environments';
import { MatIcon } from '@angular/material/icon';

// form        → user filling in plan + phone
// processing  → STK push sent, polling for confirmation
// failed      → STK push error or timeout → choose manual fallback
// manual-till → step-by-step till number instructions
// manual-paybill → step-by-step paybill instructions
type PaymentState = 'form' | 'processing' | 'failed' | 'manual-till' | 'manual-paybill';

@Component({
  selector: 'app-pay-hire',
  standalone: true,
  templateUrl: './pay.component.html',
  styleUrls: ['./pay.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatIcon,
  ],
})
export class PayComponent implements OnInit, OnDestroy {
  payForm: FormGroup;
  houseHelpName: string = '';
  houseHelpId: string = '';
  houseHelpLocation: string = '';
  houseHelpCurrentCounty: string = '';
  houseHelpIsInNairobi: boolean = false;
  houseHelpCountySurcharge: number = 0;

  state: PaymentState = 'form';

  paybillNumber = environment.paybillNumber;
  accountNumber = environment.accountNumber;
  tillNumber    = environment.tillNumber;

  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  private readonly PLAN_PRICES: Record<string, number> = {
    'emergency': 500,
    'day-burg':  2500,
    'live-in':   2500,
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private snackBar: MatSnackBar,
  ) {
    this.payForm = this.fb.group({
      plan:  ['day-burg', Validators.required],
      location: ['nairobi', Validators.required],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^(\+254|254|0)[17]\d{8}$/),
      ]],
    });
  }

  ngOnInit() {
    this.houseHelpName         = this.route.snapshot.queryParams['name']          || 'House Help';
    this.houseHelpId           = this.route.snapshot.queryParams['id']            || '';
    this.houseHelpLocation     = this.route.snapshot.queryParams['location']      || '';
    this.houseHelpIsInNairobi  = this.route.snapshot.queryParams['inNairobi']     === 'true';
    this.houseHelpCountySurcharge = Number(this.route.snapshot.queryParams['countySurcharge'] || 0);
    this.houseHelpCurrentCounty   = this.route.snapshot.queryParams['currentCounty'] || '';
  }

  ngOnDestroy() {
    this.clearPoll();
  }

  // ── amounts ────────────────────────────────────────────────────────────────

  getBasePlanAmount(): number {
    return this.PLAN_PRICES[this.payForm.get('plan')?.value] ?? 0;
  }

  getTotalAmount(): number {
    return this.getBasePlanAmount() + this.houseHelpCountySurcharge;
  }

  // ── STK push ───────────────────────────────────────────────────────────────

  pay() {
    if (this.payForm.invalid || this.state !== 'form') return;

    this.state = 'processing';

    let phone: string = this.payForm.value.phone;
    if (phone.startsWith('0'))    phone = '254' + phone.slice(1);
    else if (phone.startsWith('+')) phone = phone.slice(1);

    const storedUser = localStorage.getItem('user');
    const email = storedUser ? JSON.parse(storedUser)?.email : null;

    this.paymentService.initiateStkPush({
      phoneNumber: phone,
      amount:      this.getTotalAmount(),
      email,
      accountReference: `HIRE-${this.houseHelpId}`,
      transactionDesc:  `Subscription for ${this.houseHelpName}`,
    } as any).subscribe({
      next: (response) => {
        const checkoutRequestId = response?.checkoutRequestId || response?.CheckoutRequestID;
        if (checkoutRequestId) {
          this.snackBar.open('M-Pesa prompt sent! Enter your PIN on your phone.', 'OK', { duration: 6000 });
          this.startPolling(checkoutRequestId);
        } else {
          // Push accepted but no ID — fall back silently
          this.fallbackToManual();
        }
      },
      error: () => {
        // Network error or Daraja credentials not yet configured
        this.fallbackToManual();
      },
    });
  }

  // ── polling ────────────────────────────────────────────────────────────────

  private startPolling(checkoutRequestId: string) {
    let attempts = 0;
    const maxAttempts = 20; // 20 × 3 s = 60 s

    this.pollIntervalId = setInterval(() => {
      attempts++;

      this.paymentService.checkPaymentStatus(checkoutRequestId).subscribe({
        next: (status) => {
          if (status.status === 'SUCCESS') {
            this.clearPoll();
            this.snackBar.open('Payment confirmed!', 'Close', { duration: 4000 });
            this.router.navigate(['/listings']);
          } else if (status.status === 'FAILED') {
            this.clearPoll();
            this.fallbackToManual();
          }
        },
        error: () => { /* transient — keep polling */ },
      });

      if (attempts >= maxAttempts) {
        this.clearPoll();
        this.fallbackToManual();
      }
    }, 3000);
  }

  private clearPoll() {
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  // Transition to 'failed' — user chooses till or paybill from there
  private fallbackToManual() {
    this.clearPoll();
    this.state = 'failed';
  }

  // ── navigation helpers ─────────────────────────────────────────────────────

  chooseTill()    { this.state = 'manual-till'; }
  choosePaybill() { this.state = 'manual-paybill'; }
  retryStk()      { this.state = 'form'; }
  goToSuccess()   { this.router.navigate(['/listings']); }
}
