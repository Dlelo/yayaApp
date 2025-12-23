import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../auth/auth.service';

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from './pay.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';


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
    MatProgressSpinnerModule
  ],
})

export class PayComponent implements OnInit {
  payForm: FormGroup;
  houseHelpName: string = '';
  houseHelpId: string = '';
  isProcessing: boolean = false;

  user = localStorage.getItem('user');

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private snackBar: MatSnackBar,

  ) {
    this.payForm = this.fb.group({
      plan: ['basic', Validators.required],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^(\+254|254|0)[17]\d{8}$/)
      ]]
    });
  }

  ngOnInit() {
    this.houseHelpName = this.route.snapshot.queryParams['name'] || 'House Help';
    this.houseHelpId = this.route.snapshot.queryParams['id'] || '';
  }

  pay() {
    if (this.payForm.invalid || this.isProcessing) return;

    this.isProcessing = true;

    const amount = this.payForm.value.plan === 'emergency' ? 500 : 2500;

    let phone = this.payForm.value.phone;
    if (phone.startsWith('0')) {
      phone = '254' + phone.substring(1);
    } else if (phone.startsWith('+254')) {
      phone = phone.substring(1);
    }

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const email = user?.email;


    const paymentRequest = {
      phoneNumber: phone,
      amount: amount,
      email: email,
      accountReference: `HIRE-${this.houseHelpId}`,
      transactionDesc: `Subscription for ${this.houseHelpName}`
    };

    this.snackBar.open('Initiating payment...', 'Close', { duration: 3000 });

    this.paymentService.initiateStkPush(paymentRequest).subscribe({
      next: (response) => {
        this.snackBar.open(
          'Check your phone for M-Pesa prompt!',
          'OK',
          { duration: 5000 }
        );

        // Start checking payment status
        this.checkPaymentStatus(response?.CheckoutRequestID);
      },
      error: (error) => {
        this.isProcessing = false;
        this.snackBar.open(
          error.error?.message || 'Payment initiation failed',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  checkPaymentStatus(checkoutRequestId: string) {
    let attempts = 0;
    const maxAttempts = 20; // Check for 20 seconds

    const intervalId = setInterval(() => {
      attempts++;

      this.paymentService.checkPaymentStatus(checkoutRequestId).subscribe({
        next: (status) => {
          if (status.status === 'SUCCESS') {
            clearInterval(intervalId);
            this.isProcessing = false;
            this.snackBar.open('Payment successful!', 'Close', { duration: 3000 });

            // Navigate to success page or confirm hire
            this.router.navigate(['/hire'], {
              queryParams: {
                houseHelpId: this.houseHelpId,
                houseHelpName: this.houseHelpName
              }
            });
          } else if (status.status === 'FAILED') {
            clearInterval(intervalId);
            this.isProcessing = false;
            this.snackBar.open(
              `Payment failed: ${status.failureReason}`,
              'Close',
              { duration: 5000 }
            );
            this.router.navigate(['/listings']);
          }
        },
        error: () => {
          // Continue checking on error
        }
      });

      // Stop after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        this.isProcessing = false;
        this.snackBar.open(
          'Payment verification timed out. Please check your M-Pesa messages.',
          'Close',
          { duration: 5000 }
        );
      }
    }, 1000);
  }
}
