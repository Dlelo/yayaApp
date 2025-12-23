import {Component, inject} from '@angular/core';
import {MatCard} from '@angular/material/card';
import {MatDivider} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {LoginService} from '../login/login.service';
import {AccountDetailsService} from '../account-details/account-details.service';
import {filter, Observable, shareReplay, switchMap} from 'rxjs';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [
    MatIconModule,
    MatCard,
    MatDivider,
    MatButton,
    AsyncPipe
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {

  private readonly router:Router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);

  userId = this.loginService.userId();

  /** Primary stream */
  userDetails$!: Observable<UserDetails>;

  /** Derived streams */
  houseHelpDetails$!: Observable<HouseHelp>;


  houseHelp = {
    name: 'Mary Akinyi',
    role: 'Housekeeper',
    photo: '/househelp-banner.png',
    description: 'Mary is a reliable housekeeper with 5 years of experience in managing households, cooking, and childcare.',
    skills: ['Cleaning', 'Cooking', 'Childcare', 'Laundry'],
    experience: 5,
    phone: '+254 712 345678',
    email: 'mary@example.com'
  };

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
  }


  navigate(path: string) {
    this.router.navigate([path]);
  }
}
