import { Component, inject, OnInit } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatCard } from '@angular/material/card';
import { AsyncPipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { AccountDetailsService } from './account-details.service';
import { Observable, filter, shareReplay, switchMap } from 'rxjs';
import { LoginService } from '../login/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  standalone: true,
  imports: [
    MatDivider,
    MatIconModule,
    MatCard,
    NgClass,
    MatButton,
    AsyncPipe,
  ],
})
export class AccountDetailsComponent implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly router = inject(Router);

  userId = this.loginService.userId();

  /** Primary stream */
  userDetails$!: Observable<UserDetails>;

  /** Derived streams */
  houseHelpDetails$!: Observable<HouseHelp>;
  homeOwnerDetails$!: Observable<HomeOwner>;

  ngOnInit(): void {
    if (!this.userId) return;

    /** Fetch user ONCE */
    this.userDetails$ = this.accountDetails
      .getUserById(this.userId)
      .pipe(shareReplay(1));

    /** HouseHelp details */
    this.houseHelpDetails$ = this.userDetails$.pipe(
      filter(user => user.roles.includes('HOUSEHELP')),
      filter(user => !!user.houseHelp?.id),
      switchMap(user =>
        this.accountDetails.getHouseHelpDetails(user.houseHelp.id)
      )
    );

    /** HomeOwner details */
    this.homeOwnerDetails$ = this.userDetails$.pipe(
      filter(user => user.roles.includes('HOMEOWNER')),
      filter(user => !!user.homeOwner?.id),
      switchMap(user =>
        this.accountDetails.getHomeOwnerDetails(user.homeOwner.id)
      )
    );
  }

  editAccount(userID:number|null): void {
    this.router.navigate(['/edit-account/', userID]);
  }
}
