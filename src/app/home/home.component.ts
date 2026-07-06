import { Component, OnDestroy, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SearchService } from '../search/search.service';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // ~60s

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, FormsModule, MatInputModule, MatFormFieldModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {

  currentYear = new Date().getFullYear();
  private readonly router: Router = inject(Router);
  private readonly searchService = inject(SearchService);

  lookupState = signal<'idle' | 'sending' | 'awaiting-payment' | 'success' | 'timeout' | 'failed' | 'error'>('idle');
  errorMessage = '';

  recipientPhone = '';

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  pay(): void {
    if (!this.recipientPhone.trim()) return;

    this.lookupState.set('sending');
    this.errorMessage = '';

    this.searchService
      .initiateHouseHelpLookupPayment(this.recipientPhone.trim())
      .subscribe({
        next: (res) => {
          this.lookupState.set('awaiting-payment');
          this.startPolling(res.checkoutRequestId);
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Something went wrong. Please try again.';
          this.lookupState.set('error');
        },
      });
  }

  private startPolling(checkoutRequestId: string): void {
    let attempts = 0;
    this.pollHandle = setInterval(() => {
      attempts++;
      this.searchService.getHouseHelpLookupStatus(checkoutRequestId).subscribe({
        next: ({ status }) => {
          if (status === 'SUCCESS') {
            this.stopPolling();
            this.lookupState.set('success');
          } else if (status === 'FAILED') {
            this.stopPolling();
            this.lookupState.set('failed');
          } else if (attempts >= MAX_POLL_ATTEMPTS) {
            this.stopPolling();
            this.lookupState.set('timeout');
          }
        },
        error: () => {
          if (attempts >= MAX_POLL_ATTEMPTS) {
            this.stopPolling();
            this.lookupState.set('timeout');
          }
        },
      });
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  resetLookup(): void {
    this.stopPolling();
    this.lookupState.set('idle');
    this.recipientPhone = '';
    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  navigate(path: string) {
    if (path.startsWith('/')) {
      this.router.navigate([path]);
    } else {
      this.router.navigate(['/listing', path.toLowerCase()]);
    }
  }
}
