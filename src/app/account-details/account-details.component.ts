import { Component } from '@angular/core';
import {MatDivider} from '@angular/material/divider';
import {MatCard} from '@angular/material/card';
import {DatePipe, NgClass} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  imports: [
    MatDivider,
    MatIconModule,
    MatCard,
    NgClass,
    DatePipe,
    MatButton
  ],
  standalone: true,
})
export class AccountDetailsComponent {
  user = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+254712345678',
    subscription: {
      plan: 'Premium',
      active: true,
      expiry: new Date(2025, 11, 31),
    },
  };

  editAccount() {
    console.log('Edit account clicked');
    // TODO: navigate to edit profile form
  }

  logout() {
    console.log('Logout clicked');
    // TODO: clear session & redirect to login
  }
}
