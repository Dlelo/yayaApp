import {Component, inject, OnInit} from '@angular/core';
import {MatDivider} from '@angular/material/divider';
import {MatCard} from '@angular/material/card';
import {AsyncPipe, DatePipe, JsonPipe, NgClass} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {AuthService} from '../auth/auth.service';
import {AccountDetailsService} from './account-details.service';
import {Observable} from 'rxjs';

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
    MatButton,
    AsyncPipe,
    JsonPipe
  ],
  standalone: true,
})
export class AccountDetailsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly accountDetails:AccountDetailsService  = inject(AccountDetailsService);


  userId:string | null = this.authService.getUserId();

  userDetails: Observable<any> | undefined

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

  ngOnInit(): void {
    if(this.userId === null) return;
   this.userDetails = this.accountDetails.getHomeOwnerById(this.userId)
  }

  editAccount() {
    console.log('Edit account clicked');
    // TODO: navigate to edit profile form
  }

  logout() {
    console.log('Logout clicked');
    // TODO: clear session & redirect to login
  }
}
