import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchService, GuestConsentPayload } from './search.service';

type ConsentState = 'terms' | 'identity' | 'submitting';

export const GUEST_CONSENT_KEY = 'yayaGuestConsent';

export interface GuestConsent {
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  timestamp: number;
}

@Component({
  selector: 'app-guest-consent-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatCheckboxModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, ReactiveFormsModule,
  ],
  template: `
    <div class="consent-dialog">

      <!-- TERMS STATE -->
      @if (state() === 'terms') {
        <h2 mat-dialog-title>Before You Search</h2>
        <mat-dialog-content>
          <p class="intro">
            To access househelp listings, please agree to our terms and provide your identification
            for security and compliance purposes under the Kenya Data Protection Act, 2019.
          </p>
          <ul class="terms-list">
            <li>Profile details are for hiring purposes only and must not be shared with third parties.</li>
            <li>You will not use information for harassment, solicitation, or unsolicited marketing.</li>
            <li>Your identification, browser, timestamp, and location are logged for security audit.</li>
            <li>YayaConnect is not liable for direct arrangements made outside the platform.</li>
            <li>Payments for profile access are non-refundable.</li>
          </ul>
          <div class="policy-links">
            <a href="/privacy-policy" target="_blank">Privacy Policy</a>
            <span>·</span>
            <a href="/terms-of-use" target="_blank">Terms of Use</a>
          </div>
          <mat-checkbox [formControl]="termsControl" color="primary" class="terms-check">
            I have read and agree to the Terms of Use and Privacy Policy
          </mat-checkbox>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="close()">Cancel</button>
          <button mat-flat-button [disabled]="!termsControl.value" (click)="state.set('identity')">
            Continue <mat-icon>arrow_forward</mat-icon>
          </button>
        </mat-dialog-actions>
      }

      <!-- IDENTITY STATE -->
      @if (state() === 'identity') {
        <h2 mat-dialog-title>Your Identification</h2>
        <mat-dialog-content>
          <p class="intro">
            Your details are kept confidential and used only for security audit purposes.
            They will not be displayed publicly or shared with househelps.
          </p>
          <form [formGroup]="identityForm" class="identity-form">
            <mat-form-field appearance="outline" class="full-field">
              <mat-label>Full Name</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="fullName" placeholder="As on your National ID" />
              @if (identityForm.get('fullName')?.hasError('required') && identityForm.get('fullName')?.touched) {
                <mat-error>Full name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-field">
              <mat-label>National ID Number</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="nationalId" placeholder="e.g. 12345678" type="text" inputmode="numeric" />
              @if (identityForm.get('nationalId')?.hasError('required') && identityForm.get('nationalId')?.touched) {
                <mat-error>National ID is required</mat-error>
              }
              @if (identityForm.get('nationalId')?.hasError('pattern')) {
                <mat-error>Enter a valid Kenyan National ID (6–9 digits)</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-field">
              <mat-label>Phone Number</mat-label>
              <mat-icon matPrefix>phone</mat-icon>
              <input matInput formControlName="phoneNumber" placeholder="07XXXXXXXX or +254XXXXXXXXX" type="tel" />
              @if (identityForm.get('phoneNumber')?.hasError('required') && identityForm.get('phoneNumber')?.touched) {
                <mat-error>Phone number is required</mat-error>
              }
              @if (identityForm.get('phoneNumber')?.hasError('pattern')) {
                <mat-error>Enter a valid Kenyan phone number</mat-error>
              }
            </mat-form-field>
          </form>
          @if (errorMsg()) {
            <p class="error-msg">{{ errorMsg() }}</p>
          }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button mat-stroked-button (click)="state.set('terms')">Back</button>
          <button mat-flat-button [disabled]="identityForm.invalid" (click)="submit()">
            <mat-icon>check</mat-icon> Confirm & Search
          </button>
        </mat-dialog-actions>
      }

      <!-- SUBMITTING STATE -->
      @if (state() === 'submitting') {
        <h2 mat-dialog-title>Recording Consent…</h2>
        <mat-dialog-content class="center-content">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Please wait while we log your consent.</p>
        </mat-dialog-content>
      }

    </div>
  `,
  styles: [`
    .consent-dialog { min-width: 340px; max-width: 520px; }
    .intro { color: #475569; margin-bottom: .75rem; font-size: .9rem; line-height: 1.5; }
    .terms-list { margin: 0 0 1rem 1.2rem; color: #334155; font-size: .875rem; li { margin-bottom: .4rem; line-height: 1.4; } }
    .policy-links { display: flex; gap: .5rem; margin-bottom: 1rem; font-size: .875rem; a { color: #6366f1; text-decoration: none; &:hover { text-decoration: underline; } } }
    .terms-check { display: block; }
    .identity-form { display: flex; flex-direction: column; gap: .25rem; margin-top: .5rem; }
    .full-field { width: 100%; }
    .error-msg { color: #ef4444; font-size: .875rem; margin-top: .5rem; }
    .center-content { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem 0; text-align: center; }
  `],
})
export class GuestConsentDialogComponent {
  private dialogRef = inject(MatDialogRef<GuestConsentDialogComponent>);
  private searchService = inject(SearchService);
  private fb = inject(FormBuilder);

  state = signal<ConsentState>('terms');
  errorMsg = signal('');

  termsControl = this.fb.control(false);

  identityForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    nationalId: ['', [Validators.required, Validators.pattern(/^\d{6,9}$/)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+254|254|0)[17]\d{8}$/)]],
  });

  private consentSent = false;

  submit() {
    if (this.identityForm.invalid) return;
    this.state.set('submitting');
    this.errorMsg.set('');

    const { fullName, nationalId, phoneNumber } = this.identityForm.value as {
      fullName: string; nationalId: string; phoneNumber: string;
    };

    // Attempt geolocation; fall back after 3 s
    let geoResolved = false;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        geoResolved = true;
        this.sendConsent(fullName, nationalId, phoneNumber, pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        geoResolved = true;
        this.sendConsent(fullName, nationalId, phoneNumber, null, null);
      },
    );
    setTimeout(() => {
      if (!geoResolved) this.sendConsent(fullName, nationalId, phoneNumber, null, null);
    }, 3000);
  }

  private sendConsent(fullName: string, nationalId: string, phoneNumber: string, lat: number | null, lng: number | null) {
    if (this.consentSent) return;
    this.consentSent = true;

    const payload: GuestConsentPayload = {
      fullName,
      nationalId,
      phoneNumber,
      userAgent: navigator.userAgent,
      latitude: lat,
      longitude: lng,
      termsAccepted: true,
    };

    this.searchService.logGuestConsent(payload).subscribe({
      next: () => this.onConsentSaved(fullName, phoneNumber),
      error: () => this.onConsentSaved(fullName, phoneNumber), // save locally even if backend unavailable
    });
  }

  private onConsentSaved(fullName: string, phoneNumber: string) {
    const consent: GuestConsent = { fullName, nationalId: '', phoneNumber, timestamp: Date.now() };
    sessionStorage.setItem(GUEST_CONSENT_KEY, JSON.stringify(consent));
    this.dialogRef.close(consent);
  }

  close() { this.dialogRef.close(null); }
}
