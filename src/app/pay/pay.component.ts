import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../auth/auth.service';

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from './pay.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environments';
import { MatIcon } from '@angular/material/icon';


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

export class PayComponent implements OnInit {
  payForm: FormGroup;
  houseHelpName: string = '';
  houseHelpId: string = '';
  houseHelpLocation: string = '';
  houseHelpCurrentCounty: string = '';
  houseHelpIsInNairobi: boolean = false;
  houseHelpCountySurcharge: number = 0;
  isProcessing: boolean = false;
  isManualPayment: boolean = false; //remove after mpesa automation
  paybillNumber: number = environment.paybillNumber;
  accountNumber: number = environment.accountNumber;

  user = localStorage.getItem('user');

  // Pricing constants
  private readonly PLAN_PRICES = {
    'emergency': 500,
    'day-burg': 2500,
    'live-in': 2500
  };
  
  private readonly OUTSIDE_NAIROBI_SURCHARGE = 1500;

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
    this.houseHelpIsInNairobi = this.route.snapshot.queryParams['isInNairobi'] || '';
    this.houseHelpCountySurcharge = this.route.snapshot.queryParams['countySurcharge'] || 0;
    this.houseHelpCurrentCounty = this.route.snapshot.queryParams['currentCounty'] || '';

    console.log('Query Params:', this.route.snapshot.queryParams);
    console.log('House Help Name:', this.houseHelpName);
    console.log('House Help ID:', this.houseHelpId);
    console.log('House Help Location:', this.houseHelpLocation);

    // Auto-detect if house help is outside Nairobi
    this.autoDetectLocation();
    
    console.log(this.houseHelpName, this.houseHelpId, this.houseHelpLocation);
  }

  /**
   * Auto-detect if house help location is outside Nairobi
   */
  private autoDetectLocation() {
    if (this.houseHelpLocation) {
      const location = this.houseHelpLocation.toLowerCase().trim();
      const isNairobi = location.includes('nairobi');
      
      this.payForm.patchValue({
        location: isNairobi ? 'nairobi' : 'outside-nairobi'
      });
    }
  }

  /**
   * Check if service location is outside Nairobi
   */
  // isOutsideNairobi(): boolean {
  //   return this.payForm.get('location')?.value === 'outside-nairobi';
  // }

  /**
   * Called when location selection changes
   */
  onLocationChange(): void {
    // Update the UI - getTotalAmount() will automatically recalculate
  }

  /**
   * Get base plan amount (without surcharge)
   */
  getBasePlanAmount(): number {
    const plan = this.payForm.get('plan')?.value;
    return this.PLAN_PRICES[plan as keyof typeof this.PLAN_PRICES] || 0;
  }

  /**
   * Get total amount including location surcharge
   */
  getTotalAmount(): number {
    const baseAmount = this.getBasePlanAmount();
    const surcharge = this.houseHelpCountySurcharge;
    console.log('Base Amount:', baseAmount);
    console.log('Surcharge:', surcharge);
    return baseAmount + Number(surcharge);
  }

  /**
   * Legacy method - use getTotalAmount() instead
   * Kept for backward compatibility
   */
  getAmount() {
    return this.getTotalAmount();
  }

  goToSuccess() {
    this.router.navigate(['/listings']);
  }

  pay() {
    if (this.payForm.invalid || this.isProcessing || this.isManualPayment) return;

    // this.isProcessing = true;
    this.isManualPayment = true;

    const totalAmount = this.getTotalAmount();

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
      amount: totalAmount, // Now includes surcharge if applicable
      email: email,
      accountReference: `HIRE-${this.houseHelpId}`,
      transactionDesc: `Subscription for ${this.houseHelpName}`,
      // Additional metadata
      plan: this.payForm.value.plan,
      location: this.payForm.value.location,
      baseAmount: this.getBasePlanAmount(),
      surcharge: this.houseHelpCountySurcharge,
      isOutsideNairobi: !this.houseHelpIsInNairobi
    };

    // TODO bring this back once MPESA goes live
    // this.snackBar.open('Initiating payment...', 'Close', { duration: 3000 });

    this.paymentService.initiateStkPush(paymentRequest).subscribe({
      next: (response) => {
        console.log(response)
        this.isManualPayment = true;
        this.isProcessing = false;

        // TODO bring back after automation
        // this.snackBar.open(
        // 'Check your phone for M-Pesa prompt!',
        // 'OK',
        // { duration: 5000 }
        // );
        // Start checking payment status
        // this.checkPaymentStatus(response?.CheckoutRequestID); 
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
    const maxAttempts = this.isManualPayment ? 1 : 20; // Check for 20 seconds

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
