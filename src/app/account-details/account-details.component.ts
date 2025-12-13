import {Component, inject, OnInit} from '@angular/core';
import {MatDivider} from '@angular/material/divider';
import {MatCard} from '@angular/material/card';
import {AsyncPipe, DatePipe, JsonPipe, NgClass} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {AccountDetailsService} from './account-details.service';
import {map, Observable, switchMap, take} from 'rxjs';
import {LoginService} from '../login/login.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  imports: [
    MatDivider,
    MatIconModule,
    MatCard,
    NgClass,
    MatButton,
    AsyncPipe,
  ],
  standalone: true,
})
export class AccountDetailsComponent implements OnInit {
  private readonly loginService: LoginService = inject(LoginService);
  private readonly accountDetails:AccountDetailsService  = inject(AccountDetailsService);
  private readonly router:Router = inject(Router);


  userId:number | null = this.loginService.userId();
  houseHelpDetails: HouseHelp | null = null;
  homeOwnerDetails: HomeOwner | null = null;

  userDetails: Observable<UserDetails> | null = null;

  ngOnInit(): void {
    if(this.userId === null) return;
   this.userDetails = this.accountDetails.getUserById(this.userId);
   this.getHouseHelpDetails();
   this.getHomeOwnerDetails();
  }


  getHouseHelpDetails(): void {
    if (!this.userId) return;

    this.accountDetails
      .getUserById(this.userId)
      .pipe(
        switchMap(user => {
          if (!user.houseHelp?.id) {
            throw new Error('HouseHelp ID not found');
          }
          return this.accountDetails.getHouseHelpDetails(user.houseHelp.id);
        })
      )
      .subscribe({
        next: details => (this.houseHelpDetails = details),
        error: err => console.error(err),
      });
  }

  getHomeOwnerDetails(): void {
    if (!this.userId) return;

    this.accountDetails
      .getUserById(this.userId)
      .pipe(
        switchMap(user => {
          if (!user.houseHelp?.id) {
            throw new Error('HomeOwner ID not found');
          }
          return this.accountDetails.getHomeOwnerDetails(user.homeOwner.id);
        })
      )
      .subscribe({
        next: details => (this.homeOwnerDetails = details),
        error: err => console.error(err),
      });
  }

  editAccount() {
    this.router.navigate(['/edit-account']);
  }



}
