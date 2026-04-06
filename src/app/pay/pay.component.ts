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
  failureMessage: string = '';

  paybillNumber: number = environment.paybillNumber;
  accountNumber: number = environment.accountNumber;
  tillNumber: number = environment.tillNumber;

  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  private readonly PLAN_PRICES = {
    'emergency': 500,
    'day-burg': 2500,
    'live-in': 2500
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private snackBar: MatSnackBar,
  ) {
    this.payForm = this.fb.group({
      plan: ['day-burg', Validators.required],
      location: ['nairobi', Validators.required],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^(\+254|254|0)[17]\d{8}$/)
      ]]
    });
  }

  ngOnInit() {
    this.houseHelpName = this.route.snapshot.queryParams['name'] || 'House Help';
    this.houseHelpId = this.route.snapshot.queryParams['id'] || '';
    this.houseHelpLocation = this.route.snapshot.queryParams['location'] || '';
    this.houseHelpIsInNairobi = this.route.snapshot.queryParams['inNairobi'] === 'true';
    this.houseHelpCountySurcharge = this.route.snapshot.queryParams['countySurcharge'] || 0;
    this.houseHelpCurrentCounty = this.route.snapshot.queryParams['currentCounty'] || '';
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  getBasePlanAmount(): number {
    const plan = this.payForm.get('plan')?.value;
    return this.PLAN_PRICES[plan as keyof typeof this.PLAN_PRICES] || 0;
  }

  getTotalAmount(): number {
    return this.getBasePlanAmount() + Number(this.houseHelpCountySurcharge);
  }

  pay() {
    if (this.payForm.invalid || this.state !== 'form') return;

    this.state = 'processing';

    let phone = this.payForm.value.phone;
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (phone.startsWith('+254')) {
      phone = phone.substring(1);
    }

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;

    const paymentRequest = {
      phoneNumber: phone,
      amount: this.getTotalAmount(),
      email: user?.email,
      accountReference: `HIRE-${this.houseHelpId}`,
      transactionDesc: `Subscription for ${this.houseHelpName}`,
      plan: this.payForm.value.plan,
      location: this.payForm.value.location,
      baseAmount: this.getBasePlanAmount(),
      surcharge: this.houseHelpCountySurcharge,
      isOutsideNairobi: !this.houseHelpIsInNairobi
    };

    this.paymentService.initiateStkPush(paymentRequest).subscribe({
      next: (response) => {
        const checkoutRequestId = response?.checkoutRequestId || response?.CheckoutRequestID;
        if (checkoutRequestId) {
          this.snackBar.open('STK Push sent! Check your phone for the M-Pesa prompt.', 'OK', { duration: 5000 });
          this.pollPaymentStatus(checkoutRequestId);
        } else {
          this.onStkFailed('No checkout request ID returned. Please pay manually.');
        }
      },
      error: (error) => {
        this.onStkFailed(error.error?.message || 'Failed to initiate M-Pesa push.');
      }
    });
  }

  private pollPaymentStatus(checkoutRequestId: string) {
    let attempts = 0;
    const maxAttempts = 20; // 20 × 3s = 60 seconds

    this.pollIntervalId = setInterval(() => {
      attempts++;

      this.paymentService.checkPaymentStatus(checkoutRequestId).subscribe({
        next: (status) => {
          if (status.status === 'SUCCESS') {
            this.stopPolling();
            this.snackBar.open('Payment successful!', 'Close', { duration: 3000 });
            this.router.navigate(['/listings']);
          } else if (status.status === 'FAILED') {
            this.stopPolling();
            this.onStkFailed(status.failureReason || 'Payment was declined.');
          }
        },
        error: () => { /* keep polling on transient errors */ }
      });

      if (attempts >= maxAttempts) {
        this.stopPolling();
        this.onStkFailed('Payment confirmation timed out. Please pay manually below.');
      }
    }, 3000);
  }

  private onStkFailed(message: string) {
    this.state = 'failed';
    this.failureMessage = message;
  }

  private stopPolling() {
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  chooseTill() {
    this.state = 'manual-till';
  }

  choosePaybill() {
    this.state = 'manual-paybill';
  }

  retryStk() {
    this.state = 'form';
  }

  goToSuccess() {
    this.router.navigate(['/listings']);
  }
}
