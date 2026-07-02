import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../pay/pay.service';
import { SearchService, SubscriptionStatus } from '../search/search.service';

type PageState = 'info' | 'payment' | 'processing' | 'active';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSnackBarModule, SlicePipe,
  ],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private paymentService = inject(PaymentService);
  private searchService = inject(SearchService);
  private router = inject(Router);

  state = signal<PageState>('info');
  subscriptionStatus = signal<SubscriptionStatus | null>(null);
  errorMsg = signal('');

  phoneControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^(\+254|254|0)[17]\d{8}$/),
  ]);

  get phoneIsTouched() { return this.phoneControl.touched; }

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.searchService.getSubscriptionStatus().subscribe({
      next: (s) => {
        this.subscriptionStatus.set(s);
        if (s.active) this.state.set('active');
      },
      error: () => {},
    });
  }

  startPayment() { this.state.set('payment'); }

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
      amount: 999,
      accountReference: 'HOMEOWNER_PLUS',
      transactionDesc: 'Homeowner Plus Annual Subscription',
      email,
    } as any).subscribe({
      next: (res) => {
        const checkoutId = res?.checkoutRequestId || res?.CheckoutRequestID;
        if (checkoutId) {
          this.snackBar.open('M-Pesa prompt sent! Enter your PIN on your phone.', 'OK', { duration: 6000 });
          this.startPolling(checkoutId);
        } else {
          this.activateSubscription();
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
            clearInterval(this.pollTimer!);
            this.activateSubscription();
          } else if (status.status === 'FAILED') {
            clearInterval(this.pollTimer!);
            this.state.set('payment');
            this.errorMsg.set('Payment failed. Please try again.');
          }
        },
        error: () => {},
      });
      if (attempts >= 20) {
        clearInterval(this.pollTimer!);
        this.activateSubscription();
      }
    }, 3000);
  }

  private activateSubscription() {
    this.searchService.activateHomeownerPlus().subscribe({
      next: (s) => {
        this.subscriptionStatus.set(s);
        this.state.set('active');
        this.snackBar.open('Homeowner Plus activated! Enjoy unlimited searches.', 'Close', { duration: 5000 });
      },
      error: () => {
        this.state.set('payment');
        this.errorMsg.set('Subscription activation failed. Please contact support.');
      },
    });
  }

  goToSearch() { this.router.navigate(['/listing', 'all']); }
}
