import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface SearchCategory {
  label: string;
  icon: string;
  type: string;
  skill?: string;
}

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

  searchQuery = '';
  showTermsModal = false;
  pendingNavTarget: { type: string; params: any } | null = null;

  readonly categories: SearchCategory[] = [
    { label: 'Nanny',          icon: 'child_care',        type: 'all',       skill: 'BABYSITTING' },
    { label: 'Housekeeper',    icon: 'cleaning_services', type: 'all',       skill: 'HOUSEKEEPING' },
    { label: 'Caregiver',      icon: 'favorite',          type: 'all',       skill: 'ELDERS_CARE' },
    { label: 'Cook',           icon: 'restaurant',        type: 'all',       skill: 'COOKING' },
    { label: 'Live-in Nanny',  icon: 'home',              type: 'live_in',   skill: 'BABYSITTING' },
    { label: 'Emergency Nanny',icon: 'emergency',         type: 'emergency', skill: 'BABYSITTING' },
  ];

  search() {
    this.initiateSearch('all', this.searchQuery ? { q: this.searchQuery } : {});
  }

  searchByCategory(cat: SearchCategory) {
    const params: any = {};
    if (cat.skill) params['skill'] = cat.skill;
    this.initiateSearch(cat.type, params);
  }

  private initiateSearch(type: string, params: any) {
    if (localStorage.getItem('termsAccepted') === 'true') {
      this.router.navigate(['/listing', type], { queryParams: params });
    } else {
      this.pendingNavTarget = { type, params };
      this.showTermsModal = true;
    }
  }

  acceptTerms() {
    localStorage.setItem('termsAccepted', 'true');
    this.showTermsModal = false;
    if (this.pendingNavTarget) {
      const { type, params } = this.pendingNavTarget;
      this.pendingNavTarget = null;
      this.router.navigate(['/listing', type], { queryParams: params });
    }
  }

  declineTerms() {
    this.showTermsModal = false;
    this.pendingNavTarget = null;
  }

  navigate(path: string) {
    if (path.startsWith('/')) {
      this.router.navigate([path]);
    } else {
      this.router.navigate(['/listing', path.toLowerCase()]);
    }
  }
}
