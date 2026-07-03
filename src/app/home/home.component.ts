import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SearchService } from '../search/search.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, FormsModule, MatInputModule, MatFormFieldModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {

  currentYear = new Date().getFullYear();
  private readonly router: Router = inject(Router);
  private readonly searchService = inject(SearchService);

  lookupQuery = '';
  recipientPhone = '';
  lookupState = signal<'idle' | 'sending' | 'success' | 'not-found' | 'error'>('idle');
  lookupStep = signal<'query' | 'phone'>('query');

  proceedToPhone() {
    if (!this.lookupQuery.trim()) return;
    this.lookupStep.set('phone');
  }

  backToQuery() {
    this.lookupStep.set('query');
    this.lookupState.set('idle');
  }

  sendLookup() {
    if (!this.lookupQuery.trim() || !this.recipientPhone.trim()) return;
    this.lookupState.set('sending');
    this.searchService.lookupAndSendSms(this.lookupQuery.trim(), this.recipientPhone.trim()).subscribe({
      next: () => this.lookupState.set('success'),
      error: (err) => {
        this.lookupState.set(err?.status === 404 ? 'not-found' : 'error');
      },
    });
  }

  resetLookup() {
    this.lookupQuery = '';
    this.recipientPhone = '';
    this.lookupState.set('idle');
    this.lookupStep.set('query');
  }

  navigate(path: string) {
    if (path.startsWith('/')) {
      this.router.navigate([path]);
    } else {
      this.router.navigate(['/listing', path.toLowerCase()]);
    }
  }
}
