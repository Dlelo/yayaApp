import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environments';
import { HouseHelpLookupService } from './lookup.service';

// form            → visitor enters payer phone (+ house help phone, if not deep-linked with an id)
// processing      → STK push sent, polling for confirmation
// success         → payment confirmed, SMS sent
// failed          → STK push failed or timed out → choose manual fallback
// manual-till     → step-by-step till number instructions
// manual-paybill  → step-by-step paybill instructions
// manual-confirmed → visitor says they paid manually; we can't confirm ourselves, staff will verify and SMS will follow
type LookupState = 'form' | 'processing' | 'success' | 'failed' | 'manual-till' | 'manual-paybill' | 'manual-confirmed';

/**
 * Public, no-login-required page: a visitor pays a flat fee via M-Pesa STK
 * push to receive a house help's contact details by SMS. Contact details are
 * intentionally never shown on screen or returned by the API — they are only
 * ever delivered via SMS to the phone number that paid.
 */
@Component({
  selector: 'app-house-help-lookup',
  standalone: true,
  templateUrl: './lookup.component.html',
  styleUrls: ['./lookup.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
})
export class HouseHelpLookupComponent implements OnInit, OnDestroy {
  lookupForm: FormGroup;
  state: LookupState = 'form';

  houseHelpId: number | null = null;
  houseHelpName: string = '';

  /** Must match the backend's `househelp.lookup-fee` property (application.properties). */
  readonly LOOKUP_FEE = 100;

  paybillNumber = environment.paybillNumber;
  accountNumber = environment.accountNumber;
  tillNumber    = environment.tillNumber;

  /** Kept so the manual-payment instructions can show the payer's own number as the reference to quote. */
  lastPayerPhoneNumber = '';

  private pollIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private lookupService: HouseHelpLookupService,
    private snackBar: MatSnackBar,
  ) {
    this.lookupForm = this.fb.group({
      payerPhoneNumber: ['', [
        Validators.required,
        Validators.pattern(/^(\+254|254|0)[17]\d{8}$/),
      ]],
      houseHelpPhoneNumber: ['', [
        Validators.pattern(/^(\+254|254|0)[17]\d{8}$/),
      ]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.queryParams['id'];
    this.houseHelpId = idParam ? Number(idParam) : null;
    this.houseHelpName = this.route.snapshot.queryParams['name'] || 'this house help';

    // When there's no deep-linked id, the visitor must supply the house
    // help's phone number instead.
    if (!this.houseHelpId) {
      this.lookupForm.get('houseHelpPhoneNumber')?.setValidators([
        Validators.required,
        Validators.pattern(/^(\+254|254|0)[17]\d{8}$/),
      ]);
      this.lookupForm.get('houseHelpPhoneNumber')?.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.clearPoll();
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('0')) return '254' + phone.slice(1);
    if (phone.startsWith('+')) return phone.slice(1);
    return phone;
  }

  pay(): void {
    if (this.lookupForm.invalid || this.state !== 'form') return;

    this.state = 'processing';

    const payerPhoneNumber = this.normalizePhone(this.lookupForm.value.payerPhoneNumber);
    const houseHelpPhoneNumber = this.lookupForm.value.houseHelpPhoneNumber
      ? this.normalizePhone(this.lookupForm.value.houseHelpPhoneNumber)
      : undefined;

    // Kept in the same normalized form the backend stores against the
    // Payment row, so it matches exactly what staff see in the admin audit
    // table when reconciling a manual till/paybill payment.
    this.lastPayerPhoneNumber = payerPhoneNumber;

    this.lookupService.initiateLookupPayment({
      payerPhoneNumber,
      houseHelpId: this.houseHelpId ?? undefined,
      houseHelpPhoneNumber,
    }).subscribe({
      next: (response) => {
        if (response?.checkoutRequestId) {
          this.snackBar.open('M-Pesa prompt sent! Enter your PIN on your phone.', 'OK', { duration: 6000 });
          this.startPolling(response.checkoutRequestId);
        } else {
          // No checkoutRequestId means no payment record was created — nothing
          // for staff to reconcile a manual payment against, so send the
          // visitor back to the form rather than offering a manual fallback.
          this.snackBar.open('Could not start payment. Please try again.', 'Close', { duration: 6000 });
          this.state = 'form';
        }
      },
      error: (err) => {
        // Same reasoning as above: the initiate call itself failed (e.g. bad
        // phone number, house help not found, Daraja unreachable), so no
        // pending payment exists yet — offering manual till/paybill here
        // would be a dead end for the visitor since staff would have nothing
        // to match it against. Let them fix the form and retry instead.
        this.snackBar.open(err?.error?.message || 'Could not start payment. Please check the details and try again.', 'Close', { duration: 6000 });
        this.state = 'form';
      },
    });
  }

  private startPolling(checkoutRequestId: string): void {
    let attempts = 0;
    const maxAttempts = 20; // 20 × 3s = 60s

    this.pollIntervalId = setInterval(() => {
      attempts++;

      this.lookupService.checkLookupStatus(checkoutRequestId).subscribe({
        next: (result) => {
          if (result.status === 'SUCCESS') {
            this.clearPoll();
            this.state = 'success';
          } else if (result.status === 'FAILED') {
            // A payment record already exists at this point (pending →
            // failed), so a manual till/paybill payment can still be matched
            // up and verified by staff afterwards.
            this.clearPoll();
            this.state = 'failed';
          }
        },
        error: () => { /* transient — keep polling */ },
      });

      if (attempts >= maxAttempts) {
        this.clearPoll();
        this.state = 'failed';
      }
    }, 3000);
  }

  private clearPoll(): void {
    if (this.pollIntervalId !== null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  // ── manual payment fallback ──────────────────────────────────────────────

  chooseTill(): void    { this.state = 'manual-till'; }
  choosePaybill(): void { this.state = 'manual-paybill'; }
  retryStk(): void      { this.state = 'form'; }

  /** Visitor says they've paid manually — we can't confirm it ourselves (no webhook for manual payments). */
  confirmManualPayment(): void {
    this.state = 'manual-confirmed';
  }

  retry(): void {
    this.clearPoll();
    this.state = 'form';
  }
}
